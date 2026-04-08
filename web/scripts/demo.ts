/**
 * AgentNet Demo Script — Fully automated Stellar testnet demo
 *
 * This script:
 *   1. Creates a USDC issuer account on Stellar testnet
 *   2. Creates 5 AI agent accounts, funds them with XLM via Friendbot
 *   3. Sets up USDC trustlines for all agents
 *   4. Issues 100 USDC to each agent from our issuer
 *   5. Seeds the agents + services into the local database
 *   6. Runs multi-agent tasks with REAL on-chain USDC payments
 *   7. Prints all transaction hashes with Stellar Explorer links
 *
 * Usage:
 *   npx tsx scripts/demo.ts
 *   npx tsx scripts/demo.ts --reset    # Reset DB first
 *   npx tsx scripts/demo.ts --skip-seed # Only run demo tasks (agents must exist)
 */

import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { PrismaClient } from "@prisma/client";

// ─── Config ──────────────────────────────────────────────────────────────────

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";
const INITIAL_USDC_PER_AGENT = "100";

const horizon = new Horizon.Server(HORIZON_URL);
const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`);
}

function logTx(hash: string, label: string) {
  console.log(`   🔗 ${label}: ${EXPLORER_BASE}/tx/${hash}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fundViaFriendbot(
  publicKey: string,
  retries = 3
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (res.ok) return true;
      const body = await res.text();
      if (body.includes("createAccountAlreadyExist")) return true;
    } catch {
      if (i < retries - 1) {
        log("⏳", `Friendbot retry ${i + 2}/${retries} for ${publicKey.slice(0, 8)}...`);
        await sleep(3000 * (i + 1));
      }
    }
  }
  return false;
}

async function setupTrustline(
  secretKey: string,
  usdcAsset: Asset
): Promise<string> {
  const kp = Keypair.fromSecret(secretKey);
  const account = await horizon.loadAccount(kp.publicKey());

  // Check if trustline already exists
  const hasTrustline = account.balances.some(
    (b) =>
      "asset_code" in b &&
      b.asset_code === usdcAsset.getCode() &&
      "asset_issuer" in b &&
      b.asset_issuer === usdcAsset.getIssuer()
  );
  if (hasTrustline) return "already_exists";

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

async function sendPayment(
  senderSecret: string,
  destPublicKey: string,
  asset: Asset,
  amount: string
): Promise<string> {
  const senderKp = Keypair.fromSecret(senderSecret);
  const account = await horizon.loadAccount(senderKp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destPublicKey,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(senderKp);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

async function getBalances(
  publicKey: string,
  usdcAsset: Asset
): Promise<{ xlm: string; usdc: string }> {
  const account = await horizon.loadAccount(publicKey);
  let xlm = "0";
  let usdc = "0";
  for (const b of account.balances) {
    if (b.asset_type === "native") xlm = b.balance;
    else if (
      "asset_code" in b &&
      b.asset_code === usdcAsset.getCode() &&
      "asset_issuer" in b &&
      b.asset_issuer === usdcAsset.getIssuer()
    ) {
      usdc = b.balance;
    }
  }
  return { xlm, usdc };
}

// ─── Agent Definitions ──────────────────────────────────────────────────────

const AGENTS = [
  {
    name: "Nova",
    avatar: "🔍",
    description:
      "Elite research agent specializing in web search and information retrieval across the open internet.",
    capabilities: ["web-search", "data-retrieval"],
    services: [
      {
        name: "Web Search",
        description: "Search the web for any query and return structured results",
        category: "web-search",
        price: 0.01,
      },
    ],
  },
  {
    name: "Cipher",
    avatar: "📊",
    description:
      "Data scientist agent that transforms raw data into actionable insights.",
    capabilities: ["data-analysis", "statistics"],
    services: [
      {
        name: "Data Analysis",
        description: "Analyze data trends, correlations, and provide insights",
        category: "data-analysis",
        price: 0.02,
      },
      {
        name: "Sentiment Analysis",
        description: "Analyze text sentiment and emotional tone",
        category: "sentiment-analysis",
        price: 0.01,
      },
    ],
  },
  {
    name: "Quill",
    avatar: "✍️",
    description:
      "Creative content agent producing articles, reports, and summaries.",
    capabilities: ["content-writing", "summarization"],
    services: [
      {
        name: "Content Writing",
        description: "Generate articles, reports, and structured content",
        category: "content-writing",
        price: 0.03,
      },
    ],
  },
  {
    name: "Sentinel",
    avatar: "🛡️",
    description:
      "Security agent that reviews code for vulnerabilities and suggests improvements.",
    capabilities: ["code-review", "security"],
    services: [
      {
        name: "Code Review",
        description: "Review code for bugs, security, and best practices",
        category: "code-review",
        price: 0.02,
      },
    ],
  },
  {
    name: "Oracle",
    avatar: "💹",
    description:
      "Market data agent providing real-time price feeds and financial data.",
    capabilities: ["price-oracle", "market-data"],
    services: [
      {
        name: "Price Feed",
        description: "Get real-time price data for any asset",
        category: "price-oracle",
        price: 0.005,
      },
    ],
  },
];

// ─── Service execution (mock — same as agent-engine) ────────────────────────

function mockServiceResult(category: string, input: string): string {
  const handlers: Record<string, () => string> = {
    "web-search": () =>
      `Found 3 results for "${input}":\n1. Stellar x402 adoption grows 45%\n2. AI agents handle $2.3B in micropayments\n3. AgentNet launches on Stellar testnet`,
    "data-analysis": () =>
      `Analysis of "${input}": Trend ↑23% MoM, Confidence 87%, Recommendation: Bullish`,
    "content-writing": () =>
      `# ${input}\n\nThe landscape of ${input.toLowerCase()} is evolving rapidly with AI agents and micropayments on Stellar.`,
    "code-review": () =>
      `Code Review: ✅ No critical issues, ⚠️ 2 suggestions, Score: 8.2/10`,
    "price-oracle": () =>
      `${input.toUpperCase()}/USD: $${(Math.random() * 100).toFixed(2)} (Confidence: 95%)`,
    "sentiment-analysis": () =>
      `Sentiment: ${Math.random() > 0.5 ? "Positive" : "Neutral"}, Score: ${(0.5 + Math.random() * 0.5).toFixed(2)}`,
  };
  return (handlers[category] || (() => `Executed ${category} with: ${input}`))();
}

// ─── Demo Tasks ──────────────────────────────────────────────────────────────

const DEMO_TASKS = [
  {
    coordinatorName: "Sentinel", // Security agent buys research + data + content
    description: "Research AI agent payment trends on Stellar",
    tasks: [
      { category: "web-search", input: "AI agent payments Stellar 2026" },
      { category: "data-analysis", input: "Stellar network transaction volume Q1 2026" },
      { category: "content-writing", input: "The Rise of AI Agent Economies on Stellar" },
    ],
  },
  {
    coordinatorName: "Quill", // Content agent buys security + price + sentiment
    description: "Security audit and market analysis",
    tasks: [
      { category: "code-review", input: "function transfer(to, amount) { send(to, amount); }" },
      { category: "price-oracle", input: "XLM" },
      { category: "sentiment-analysis", input: "Stellar network growth is accelerating with x402 adoption" },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes("--reset");
  const skipSeed = args.includes("--skip-seed");

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║          🌐 AgentNet — Stellar Testnet Demo                ║");
  console.log("║          Social Economy for AI Agents                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── Phase 0: Reset (optional) ─────────────────────────────────────────
  if (shouldReset) {
    log("🗑️", "Resetting database...");
    await prisma.transaction.deleteMany();
    await prisma.service.deleteMany();
    await prisma.agent.deleteMany();
    log("✅", "Database cleared");
  }

  // Check if already seeded
  const existingAgents = await prisma.agent.findMany();
  if (existingAgents.length > 0 && !skipSeed && !shouldReset) {
    log("ℹ️", `${existingAgents.length} agents already exist. Use --reset to start fresh or --skip-seed to use existing.`);
    log("ℹ️", "Continuing with existing agents...\n");
  }

  let issuerSecret: string;
  let usdcAsset: Asset;
  let dbAgents: Array<{
    id: string;
    name: string;
    avatar: string;
    publicKey: string;
    secretKey: string;
  }>;

  if (existingAgents.length === 0 || shouldReset) {
    // ── Phase 1: Create USDC Issuer ───────────────────────────────────────
    console.log("━━━ Phase 1: Creating USDC Issuer on Stellar Testnet ━━━\n");

    const issuerKp = Keypair.random();
    issuerSecret = issuerKp.secret();
    usdcAsset = new Asset("USDC", issuerKp.publicKey());

    log("🔑", `Issuer Public Key: ${issuerKp.publicKey()}`);
    log("🌐", `${EXPLORER_BASE}/account/${issuerKp.publicKey()}`);

    log("💧", "Funding issuer via Friendbot...");
    const issuerFunded = await fundViaFriendbot(issuerKp.publicKey());
    if (!issuerFunded) {
      console.error("❌ Failed to fund issuer account. Check your internet connection.");
      process.exit(1);
    }
    log("✅", "Issuer funded with 10,000 XLM\n");

    // ── Phase 2: Create & Fund Agent Accounts ────────────────────────────
    console.log("━━━ Phase 2: Creating Agent Accounts ━━━\n");

    const agentWallets: Array<{
      name: string;
      publicKey: string;
      secretKey: string;
    }> = [];

    for (const agentDef of AGENTS) {
      const kp = Keypair.random();
      log("🤖", `Creating ${agentDef.name} (${agentDef.avatar})...`);
      log("   🔑", `Public Key: ${kp.publicKey()}`);

      const funded = await fundViaFriendbot(kp.publicKey());
      if (!funded) {
        console.error(`❌ Failed to fund ${agentDef.name}`);
        process.exit(1);
      }
      log("   💧", "Funded with 10,000 XLM");

      agentWallets.push({
        name: agentDef.name,
        publicKey: kp.publicKey(),
        secretKey: kp.secret(),
      });
    }
    console.log("");

    // ── Phase 3: Setup Trustlines ────────────────────────────────────────
    console.log("━━━ Phase 3: Setting Up USDC Trustlines ━━━\n");

    for (const wallet of agentWallets) {
      const txHash = await setupTrustline(wallet.secretKey, usdcAsset);
      log("🔗", `${wallet.name} trustline: ${txHash === "already_exists" ? "exists" : "created"}`);
      if (txHash !== "already_exists") {
        logTx(txHash, "Trustline TX");
      }
    }
    console.log("");

    // ── Phase 4: Issue USDC to Agents ────────────────────────────────────
    console.log("━━━ Phase 4: Distributing USDC to Agents ━━━\n");

    for (const wallet of agentWallets) {
      const txHash = await sendPayment(
        issuerSecret,
        wallet.publicKey,
        usdcAsset,
        INITIAL_USDC_PER_AGENT
      );
      log("💰", `Sent ${INITIAL_USDC_PER_AGENT} USDC to ${wallet.name}`);
      logTx(txHash, "Distribution TX");
    }
    console.log("");

    // ── Phase 5: Verify Balances ─────────────────────────────────────────
    console.log("━━━ Phase 5: Verifying Balances ━━━\n");

    for (const wallet of agentWallets) {
      const bal = await getBalances(wallet.publicKey, usdcAsset);
      log("💳", `${wallet.name}: ${bal.usdc} USDC, ${parseFloat(bal.xlm).toFixed(2)} XLM`);
    }
    console.log("");

    // ── Phase 6: Seed Database ───────────────────────────────────────────
    console.log("━━━ Phase 6: Seeding Database ━━━\n");

    dbAgents = [];

    // Save the issuer public key for the app to use
    log("📝", `USDC Issuer for .env: ${issuerKp.publicKey()}`);

    for (let i = 0; i < AGENTS.length; i++) {
      const agentDef = AGENTS[i];
      const wallet = agentWallets[i];

      const agent = await prisma.agent.create({
        data: {
          name: agentDef.name,
          avatar: agentDef.avatar,
          description: agentDef.description,
          capabilities: JSON.stringify(agentDef.capabilities),
          publicKey: wallet.publicKey,
          secretKey: wallet.secretKey,
        },
      });

      for (const svc of agentDef.services) {
        await prisma.service.create({
          data: {
            name: svc.name,
            description: svc.description,
            category: svc.category,
            price: svc.price,
            endpoint: `/services/${svc.category}/${agent.id}`,
            agentId: agent.id,
          },
        });
      }

      dbAgents.push({
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        publicKey: wallet.publicKey,
        secretKey: wallet.secretKey,
      });
      log("💾", `Saved ${agentDef.name} to DB (${agent.id})`);
    }

    // Update .env with our custom issuer
    const fs = await import("fs");
    const envPath = new URL("../.env", import.meta.url).pathname;
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(
      /USDC_ISSUER="[^"]*"/,
      `USDC_ISSUER="${issuerKp.publicKey()}"`
    );
    if (!envContent.includes("SIMULATE_PAYMENTS")) {
      envContent += '\nSIMULATE_PAYMENTS="false"\n';
    }
    envContent = envContent.replace(
      /SIMULATE_PAYMENTS="[^"]*"/,
      'SIMULATE_PAYMENTS="false"'
    );
    fs.writeFileSync(envPath, envContent);
    log("📝", "Updated .env with issuer public key and SIMULATE_PAYMENTS=false");

    console.log("");
  } else {
    // Use existing agents
    dbAgents = existingAgents.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      publicKey: a.publicKey,
      secretKey: a.secretKey,
    }));

    // Read issuer from env
    const envIssuer = process.env.USDC_ISSUER || "";
    usdcAsset = new Asset("USDC", envIssuer);
    issuerSecret = ""; // Not needed for payments between agents
    log("ℹ️", `Using existing ${dbAgents.length} agents`);
    log("ℹ️", `USDC Issuer: ${envIssuer}\n`);
  }

  // ── Phase 7: Execute Agent-to-Agent Tasks with Real Payments ─────────
  console.log("━━━ Phase 7: Executing Agent-to-Agent Tasks (Real USDC Payments) ━━━\n");

  const allTxHashes: Array<{
    from: string;
    to: string;
    amount: string;
    service: string;
    txHash: string;
  }> = [];

  for (const scenario of DEMO_TASKS) {
    log("📋", `Scenario: ${scenario.description}`);

    // Pick a coordinator (agent that will pay for services)
    const coordinator = dbAgents.find((a) => a.name === scenario.coordinatorName) || dbAgents[0];
    log("🤖", `Coordinator: ${coordinator.name} (${coordinator.avatar})`);

    for (const task of scenario.tasks) {
      // Find the agent that offers this service
      const service = await prisma.service.findFirst({
        where: {
          category: task.category,
          isActive: true,
          agentId: { not: coordinator.id },
        },
        include: { agent: true },
      });

      if (!service) {
        log("⚠️", `No service found for ${task.category}, skipping`);
        continue;
      }

      const provider = dbAgents.find((a) => a.id === service.agentId);
      if (!provider) continue;

      log("   💸", `${coordinator.name} → ${service.agent.name}: $${service.price} for ${service.name}`);

      // Execute real Stellar payment
      try {
        const txHash = await sendPayment(
          coordinator.secretKey,
          provider.publicKey,
          usdcAsset,
          service.price.toFixed(7)
        );

        // Simulate service execution
        const result = mockServiceResult(task.category, task.input);

        // Record in DB
        await prisma.transaction.create({
          data: {
            amount: service.price,
            stellarTxHash: txHash,
            status: "completed",
            taskDescription: `${service.name}: ${task.input}`,
            result: JSON.stringify({ output: result }),
            senderId: coordinator.id,
            receiverId: service.agentId,
            serviceId: service.id,
          },
        });

        // Update stats
        await prisma.agent.update({
          where: { id: coordinator.id },
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

        logTx(txHash, "Payment TX");
        log("   ✅", `Result: ${result.slice(0, 80)}...`);

        allTxHashes.push({
          from: coordinator.name,
          to: service.agent.name,
          amount: `$${service.price}`,
          service: service.name,
          txHash,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("   ❌", `Payment failed: ${msg}`);

        // Record failed tx
        await prisma.transaction.create({
          data: {
            amount: service.price,
            status: "failed",
            taskDescription: `${service.name}: ${task.input}`,
            result: JSON.stringify({ error: msg }),
            senderId: coordinator.id,
            receiverId: service.agentId,
            serviceId: service.id,
          },
        });
      }
    }
    console.log("");
  }

  // ── Phase 8: Final Report ──────────────────────────────────────────────
  console.log("━━━ Phase 8: Final Report ━━━\n");

  // Transaction summary
  const totalTx = await prisma.transaction.count();
  const completedTx = await prisma.transaction.count({ where: { status: "completed" } });
  const totalVolume = await prisma.transaction.aggregate({
    where: { status: "completed" },
    _sum: { amount: true },
  });

  log("📊", `Total Transactions: ${totalTx}`);
  log("✅", `Completed: ${completedTx}`);
  log("💰", `Total Volume: $${(totalVolume._sum.amount || 0).toFixed(4)} USDC`);
  console.log("");

  // Agent balances
  log("💳", "Final Agent Balances:");
  for (const agent of dbAgents) {
    try {
      const bal = await getBalances(agent.publicKey, usdcAsset);
      const dbAgent = await prisma.agent.findUnique({ where: { id: agent.id } });
      log(
        "   " + agent.avatar,
        `${agent.name}: ${bal.usdc} USDC (earned: $${dbAgent?.totalEarned.toFixed(4)}, spent: $${dbAgent?.totalSpent.toFixed(4)})`
      );
    } catch {
      log("   " + agent.avatar, `${agent.name}: balance check failed`);
    }
  }
  console.log("");

  // Transaction links
  if (allTxHashes.length > 0) {
    log("🔗", "Stellar Explorer Transaction Links:");
    for (const tx of allTxHashes) {
      console.log(`   ${tx.from} → ${tx.to} (${tx.amount} for ${tx.service})`);
      console.log(`   ${EXPLORER_BASE}/tx/${tx.txHash}`);
      console.log("");
    }
  }

  // Agent explorer links
  log("🔗", "Agent Account Links:");
  for (const agent of dbAgents) {
    console.log(`   ${agent.avatar} ${agent.name}: ${EXPLORER_BASE}/account/${agent.publicKey}`);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Demo Complete! Start the web app: npm run dev          ║");
  console.log("║  Open http://localhost:3000 to see the live dashboard       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ Demo failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
