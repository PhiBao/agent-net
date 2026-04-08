import { NextRequest, NextResponse } from "next/server";
import { executeAgentTask } from "@/lib/agent-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { task } = body;

  if (!task) {
    return NextResponse.json({ error: "task is required" }, { status: 400 });
  }

  const result = await executeAgentTask(id, task);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
