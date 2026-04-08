import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const services = await prisma.service.findMany({
    where: { agentId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, category, price } = body;

  if (!name || !description || !category || price === undefined) {
    return NextResponse.json(
      { error: "name, description, category, and price are required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      category,
      price: parseFloat(price),
      endpoint: `/services/${category}/${id}`,
      agentId: id,
    },
  });

  return NextResponse.json(service);
}
