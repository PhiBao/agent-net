import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [totalAgents, totalServices, totalTransactions, totalVolume] =
    await Promise.all([
      prisma.agent.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.transaction.count({ where: { status: "completed" } }),
      prisma.transaction.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
    ]);

  const topAgents = await prisma.agent.findMany({
    orderBy: { reputation: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      avatar: true,
      reputation: true,
      totalEarned: true,
      totalSpent: true,
    },
  });

  const recentTransactions = await prisma.transaction.findMany({
    include: {
      sender: { select: { name: true, avatar: true } },
      receiver: { select: { name: true, avatar: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    stats: {
      totalAgents,
      totalServices,
      totalTransactions,
      totalVolume: totalVolume._sum.amount || 0,
    },
    topAgents,
    recentTransactions,
  });
}
