import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBalance, getStellarExplorerUrl } from "@/lib/stellar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      services: true,
      sentTransactions: {
        include: {
          receiver: { select: { id: true, name: true, avatar: true } },
          service: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      receivedTransactions: {
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          service: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const balance = await getBalance(agent.publicKey);

  return NextResponse.json({
    ...agent,
    secretKey: undefined,
    capabilities: JSON.parse(agent.capabilities),
    approvedCategories: JSON.parse(agent.approvedCategories),
    balance,
    explorerUrl: getStellarExplorerUrl(agent.publicKey),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { maxPerTx, dailyBudget, approvedCategories } = body;

  const updateData: Record<string, unknown> = {};
  if (maxPerTx !== undefined) updateData.maxPerTx = maxPerTx;
  if (dailyBudget !== undefined) updateData.dailyBudget = dailyBudget;
  if (approvedCategories !== undefined)
    updateData.approvedCategories = JSON.stringify(approvedCategories);

  const agent = await prisma.agent.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    ...agent,
    secretKey: undefined,
    capabilities: JSON.parse(agent.capabilities),
  });
}
