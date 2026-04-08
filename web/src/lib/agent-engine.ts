import { prisma } from "@/lib/db";
import { sendUSDC } from "@/lib/stellar";

const SIMULATE_PAYMENTS = process.env.SIMULATE_PAYMENTS === "true";

interface ServiceResult {
  output: string;
  metadata?: Record<string, unknown>;
}

const SERVICE_HANDLERS: Record<string, (input: string) => Promise<ServiceResult>> = {
  "web-search": async (query: string) => {
    await delay(800);
    const results = [
      `Found 3 relevant results for "${query}":`,
      `1. Stellar Network sees 45% growth in Q1 2026 — CoinDesk`,
      `2. x402 Protocol adoption surges with 200+ services — The Block`,
      `3. AI agents now handle $2.3B in micropayments — TechCrunch`,
    ];
    return { output: results.join("\n"), metadata: { resultCount: 3 } };
  },
  "data-analysis": async (input: string) => {
    await delay(1200);
    return {
      output: `Analysis of "${input}":\n• Trend: Upward (+23% MoM)\n• Key insight: Strong correlation between agent adoption and transaction volume\n• Confidence: 87%\n• Recommendation: Bullish outlook for Q2`,
      metadata: { confidence: 0.87, trend: "upward" },
    };
  },
  "content-writing": async (topic: string) => {
    await delay(1500);
    return {
      output: `# ${topic}\n\nThe landscape of ${topic.toLowerCase()} is evolving rapidly. Key developments include the rise of autonomous AI agents, micropayment protocols like x402, and decentralized service marketplaces.\n\nIn Q1 2026, we observed significant growth in agent-to-agent transactions on Stellar, with USDC micropayments enabling frictionless value exchange between AI services.\n\nLooking ahead, the convergence of AI capabilities and payment infrastructure promises to reshape how digital services are consumed and monetized.`,
      metadata: { wordCount: 68 },
    };
  },
  "code-review": async (code: string) => {
    await delay(1000);
    return {
      output: `Code Review Results:\n✅ No critical vulnerabilities found\n⚠️ 2 suggestions:\n  1. Consider adding input validation on line 15\n  2. The async handler should include error boundaries\n📊 Quality Score: 8.2/10\n💡 Overall: Clean implementation with minor improvements suggested`,
      metadata: { score: 8.2, issues: 0, suggestions: 2 },
    };
  },
  "price-oracle": async (asset: string) => {
    await delay(500);
    const prices: Record<string, number> = {
      XLM: 0.142,
      BTC: 68420,
      ETH: 3850,
      USDC: 1.0,
      default: Math.random() * 100,
    };
    const price = prices[asset.toUpperCase()] ?? prices.default;
    return {
      output: `${asset.toUpperCase()}/USD: $${price.toFixed(2)}\nSource: AgentNet Oracle\nTimestamp: ${new Date().toISOString()}\nConfidence: 95%`,
      metadata: { price, asset: asset.toUpperCase(), timestamp: Date.now() },
    };
  },
  "sentiment-analysis": async (text: string) => {
    await delay(700);
    const sentiment = Math.random() > 0.5 ? "positive" : "neutral";
    const score = 0.5 + Math.random() * 0.5;
    return {
      output: `Sentiment Analysis:\n• Text: "${text.slice(0, 80)}..."\n• Sentiment: ${sentiment}\n• Score: ${score.toFixed(2)}\n• Key phrases: "growth", "innovation", "adoption"`,
      metadata: { sentiment, score },
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeService(
  serviceCategory: string,
  input: string
): Promise<ServiceResult> {
  const handler = SERVICE_HANDLERS[serviceCategory];
  if (!handler) {
    return { output: `Service "${serviceCategory}" executed with input: ${input}` };
  }
  return handler(input);
}

export async function executeAgentTask(
  agentId: string,
  task: string
): Promise<{
  success: boolean;
  transactions: string[];
  finalResult: string;
  error?: string;
}> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { services: true },
  });

  if (!agent) {
    return { success: false, transactions: [], finalResult: "", error: "Agent not found" };
  }

  // Find relevant services from OTHER agents
  const availableServices = await prisma.service.findMany({
    where: {
      isActive: true,
      agentId: { not: agentId },
    },
    include: { agent: true },
    orderBy: { agent: { reputation: "desc" } },
  });

  if (availableServices.length === 0) {
    return {
      success: false,
      transactions: [],
      finalResult: "",
      error: "No available services from other agents",
    };
  }

  const txIds: string[] = [];
  const results: string[] = [];

  // Pick up to 3 relevant services for the task
  const selectedServices = availableServices.slice(0, Math.min(3, availableServices.length));

  for (const service of selectedServices) {
    // Check spending policy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySpent = await prisma.transaction.aggregate({
      where: {
        senderId: agentId,
        status: "completed",
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const spentToday = todaySpent._sum.amount || 0;
    if (spentToday + service.price > agent.dailyBudget) {
      results.push(`⚠️ Skipped ${service.name}: would exceed daily budget ($${spentToday.toFixed(2)}/$${agent.dailyBudget})`);
      continue;
    }

    if (service.price > agent.maxPerTx) {
      results.push(`⚠️ Skipped ${service.name}: price $${service.price} exceeds per-tx limit $${agent.maxPerTx}`);
      continue;
    }

    // Execute the payment on Stellar (or simulate if env says so)
    let paymentResult: { success: boolean; txHash?: string; error?: string };

    if (SIMULATE_PAYMENTS) {
      // Simulate successful payment for local dev without funded wallets
      await delay(300);
      const { randomBytes } = await import("crypto");
      paymentResult = {
        success: true,
        txHash: randomBytes(32).toString("hex"),
      };
    } else {
      console.log(
        `💸 Sending $${service.price} USDC: ${agent.name} → ${service.agent.name} for ${service.name}`
      );
      paymentResult = await sendUSDC(
        agent.secretKey,
        service.agent.publicKey,
        service.price.toFixed(7)
      );
      if (paymentResult.success) {
        console.log(`  ✅ TX: ${paymentResult.txHash}`);
      } else {
        console.error(`  ❌ Payment failed: ${paymentResult.error}`);
      }
    }

    // Execute the service
    const serviceResult = await executeService(service.category, task);

    // Record transaction
    const tx = await prisma.transaction.create({
      data: {
        amount: service.price,
        stellarTxHash: paymentResult.txHash || null,
        status: paymentResult.success ? "completed" : "failed",
        taskDescription: `${service.name}: ${task}`,
        result: JSON.stringify(serviceResult),
        senderId: agentId,
        receiverId: service.agentId,
        serviceId: service.id,
      },
    });

    txIds.push(tx.id);

    if (paymentResult.success) {
      // Update agent balances
      await prisma.agent.update({
        where: { id: agentId },
        data: { totalSpent: { increment: service.price } },
      });
      await prisma.agent.update({
        where: { id: service.agentId },
        data: {
          totalEarned: { increment: service.price },
          reputation: { increment: 0.1 },
        },
      });
      await prisma.service.update({
        where: { id: service.id },
        data: { totalCalls: { increment: 1 } },
      });

      results.push(`✅ ${service.agent.name} → ${service.name}: ${serviceResult.output}`);
    } else {
      results.push(`❌ Payment failed for ${service.name}: ${paymentResult.error}`);
    }
  }

  const finalResult = results.join("\n\n---\n\n");

  return {
    success: true,
    transactions: txIds,
    finalResult,
  };
}
