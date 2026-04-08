import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndFundAgent } from "@/lib/stellar";

const SEED_AGENTS = [
  {
    name: "Nova",
    avatar: "🔍",
    description: "Elite research agent specializing in web search and information retrieval across the open internet.",
    capabilities: ["web-search", "data-retrieval"],
    services: [
      {
        name: "Web Search",
        description: "Search the web for any query and return structured results with sources",
        category: "web-search",
        price: 0.01,
      },
    ],
  },
  {
    name: "Cipher",
    avatar: "📊",
    description: "Data scientist agent that transforms raw data into actionable insights with statistical analysis.",
    capabilities: ["data-analysis", "statistics"],
    services: [
      {
        name: "Data Analysis",
        description: "Analyze data trends, correlations, and provide statistical insights",
        category: "data-analysis",
        price: 0.02,
      },
      {
        name: "Sentiment Analysis",
        description: "Analyze text sentiment and emotional tone with confidence scores",
        category: "sentiment-analysis",
        price: 0.01,
      },
    ],
  },
  {
    name: "Quill",
    avatar: "✍️",
    description: "Creative content agent producing articles, reports, and summaries from structured inputs.",
    capabilities: ["content-writing", "summarization"],
    services: [
      {
        name: "Content Writing",
        description: "Generate articles, reports, and structured content on any topic",
        category: "content-writing",
        price: 0.03,
      },
    ],
  },
  {
    name: "Sentinel",
    avatar: "🛡️",
    description: "Security-focused agent that reviews code for vulnerabilities and suggests improvements.",
    capabilities: ["code-review", "security"],
    services: [
      {
        name: "Code Review",
        description: "Review code for bugs, security issues, and best practices",
        category: "code-review",
        price: 0.02,
      },
    ],
  },
  {
    name: "Oracle",
    avatar: "💹",
    description: "Market data agent providing real-time price feeds and financial data from multiple sources.",
    capabilities: ["price-oracle", "market-data"],
    services: [
      {
        name: "Price Feed",
        description: "Get real-time price data for any cryptocurrency or asset",
        category: "price-oracle",
        price: 0.005,
      },
    ],
  },
];

export async function POST() {
  const existingCount = await prisma.agent.count();
  if (existingCount > 0) {
    return NextResponse.json({
      message: "Agents already exist, skipping seed",
      count: existingCount,
    });
  }

  const created = [];

  for (const seed of SEED_AGENTS) {
    const wallet = await createAndFundAgent();

    const agent = await prisma.agent.create({
      data: {
        name: seed.name,
        avatar: seed.avatar,
        description: seed.description,
        capabilities: JSON.stringify(seed.capabilities),
        publicKey: wallet.publicKey,
        secretKey: wallet.secretKey,
      },
    });

    for (const svc of seed.services) {
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

    created.push({
      name: agent.name,
      publicKey: wallet.publicKey,
      funded: wallet.funded,
      trustline: wallet.trustline,
    });
  }

  return NextResponse.json({
    message: `Seeded ${created.length} agents`,
    agents: created,
  });
}
