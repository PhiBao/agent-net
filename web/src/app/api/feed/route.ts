import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 200);
  const after = searchParams.get("after");

  const where = after ? { createdAt: { gt: new Date(after) } } : {};

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, avatar: true, publicKey: true } },
      receiver: { select: { id: true, name: true, avatar: true, publicKey: true } },
      service: { select: { name: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}
