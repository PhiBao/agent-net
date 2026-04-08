"use client";

import Link from "next/link";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    avatar: string;
    description: string;
    capabilities: string[];
    reputation: number;
    totalEarned: number;
    totalSpent: number;
    publicKey: string;
    services: { id: string; name: string; price: number; category: string }[];
    _count: { sentTransactions: number; receivedTransactions: number };
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const totalTx =
    agent._count.sentTransactions + agent._count.receivedTransactions;

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-violet-500/5">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-2xl">
                {agent.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-yellow-500">
                    {"★".repeat(Math.min(5, Math.ceil(agent.reputation)))}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {agent.reputation.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-emerald-400">
                ${agent.totalEarned.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-500">earned</div>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
            {agent.description}
          </p>

          {/* Capabilities */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300"
              >
                {cap}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>{agent.services.length} services</span>
              <span>{totalTx} transactions</span>
            </div>
            <span className="font-mono text-xs text-zinc-600">
              {agent.publicKey.slice(0, 4)}...{agent.publicKey.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
