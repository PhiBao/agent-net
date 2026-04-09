import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndFundAgent } from "@/lib/stellar";

export async function GET() {
  const agents = await prisma.agent.findMany({
    include: {
      services: { where: { isActive: true } },
      _count: {
        select: {
          sentTransactions: true,
          receivedTransactions: true,
        },
      },
    },
    orderBy: { reputation: "desc" },
  });

  const result = agents.map((a) => ({
    id: a.id,
    name: a.name,
    avatar: a.avatar,
    description: a.description,
    capabilities: JSON.parse(a.capabilities),
    approvedCategories: JSON.parse(a.approvedCategories),
    publicKey: a.publicKey,
    reputation: a.reputation,
    totalEarned: a.totalEarned,
    totalSpent: a.totalSpent,
    maxPerTx: a.maxPerTx,
    dailyBudget: a.dailyBudget,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    services: a.services,
    _count: a._count,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, avatar, description, capabilities } = body;

  if (!name || !description || !capabilities?.length) {
    return NextResponse.json(
      { error: "name, description, and capabilities are required" },
      { status: 400 }
    );
  }

  // Create and fund Stellar wallet
  const wallet = await createAndFundAgent();

  const agent = await prisma.agent.create({
    data: {
      name,
      avatar: avatar || "🤖",
      description,
      capabilities: JSON.stringify(capabilities),
      publicKey: wallet.publicKey,
      secretKey: wallet.secretKey,
    },
  });

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    avatar: agent.avatar,
    description: agent.description,
    capabilities: JSON.parse(agent.capabilities),
    publicKey: agent.publicKey,
    reputation: agent.reputation,
    totalEarned: agent.totalEarned,
    totalSpent: agent.totalSpent,
    createdAt: agent.createdAt,
    wallet: {
      publicKey: wallet.publicKey,
      funded: wallet.funded,
      trustline: wallet.trustline,
    },
  });
}
