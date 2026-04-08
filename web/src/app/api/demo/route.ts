import { NextRequest, NextResponse } from "next/server";
import { executeAgentTask } from "@/lib/agent-engine";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = body.task || "Research the latest trends in AI agents and the Stellar network";

  // Pick a random agent as the coordinator
  const agents = await prisma.agent.findMany({ take: 5 });
  if (agents.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 agents. Run /api/seed first." },
      { status: 400 }
    );
  }

  const coordinator = agents[0];
  const results = [];

  // Coordinator executes task — will automatically discover and pay other agents
  const result = await executeAgentTask(coordinator.id, task);
  results.push({
    coordinator: coordinator.name,
    ...result,
  });

  // Also have second agent do a follow-up task to show more agent-to-agent activity
  if (agents.length >= 3) {
    const secondAgent = agents[1];
    const secondResult = await executeAgentTask(
      secondAgent.id,
      `Analyze and summarize: ${task}`
    );
    results.push({
      coordinator: secondAgent.name,
      ...secondResult,
    });
  }

  return NextResponse.json({
    message: "Demo scenario completed",
    results,
  });
}
