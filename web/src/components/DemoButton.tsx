"use client";

import { useState } from "react";

interface DemoButtonProps {
  onComplete?: () => void;
}

export default function DemoButton({ onComplete }: DemoButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const seedAgents = async () => {
    setPhase("Seeding agents with Stellar wallets...");
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    return data;
  };

  const runDemo = async () => {
    setPhase("Executing multi-agent tasks...");
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "Research the latest trends in AI agent payments on Stellar network",
      }),
    });
    const data = await res.json();
    return data;
  };

  const handleClick = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);

    try {
      const seedResult = await seedAgents();
      setPhase(`${seedResult.message}`);

      await new Promise((r) => setTimeout(r, 1000));

      const demoResult = await runDemo();
      setResult(
        `${demoResult.message} — ${demoResult.results?.length || 0} task(s) completed`
      );
      setPhase("Done!");
      onComplete?.();
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setPhase("Failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isRunning}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 px-8 py-4 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-70 disabled:hover:scale-100"
      >
        {isRunning && (
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/50 via-cyan-500/50 to-violet-600/50 animate-pulse" />
        )}
        <span className="relative flex items-center gap-2">
          {isRunning ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {phase}
            </>
          ) : (
            <>
              <span className="text-lg">⚡</span>
              Run Live Demo
            </>
          )}
        </span>
      </button>

      {result && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
          {result}
        </div>
      )}
    </div>
  );
}
