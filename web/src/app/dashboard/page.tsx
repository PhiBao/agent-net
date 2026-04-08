"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import LiveFeed from "@/components/LiveFeed";
import StatsBar from "@/components/StatsBar";
import DemoButton from "@/components/DemoButton";
import Link from "next/link";

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
});

interface Stats {
  stats: {
    totalAgents: number;
    totalServices: number;
    totalTransactions: number;
    totalVolume: number;
  };
  topAgents: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
    totalEarned: number;
    totalSpent: number;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    createdAt: string;
    sender: { name: string; avatar: string };
    receiver: { name: string; avatar: string };
    service: { name: string };
  }[];
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Real-time overview of the AgentNet economy
          </p>
        </div>
        <DemoButton
          onComplete={() =>
            queryClient.invalidateQueries({ queryKey: ["stats"] })
          }
        />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsBar />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Graph + Feed */}
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Agent Network Graph
            </h2>
            <NetworkGraph />
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">
              All Transactions
            </h2>
            <LiveFeed />
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Top Agents
            </h2>
            <div className="space-y-3">
              {data?.topAgents?.map((agent, i) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-lg font-bold text-zinc-600">
                    #{i + 1}
                  </span>
                  <span className="text-xl">{agent.avatar}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {agent.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      ⭐ {agent.reputation.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-emerald-400">
                      ${agent.totalEarned.toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-500">earned</div>
                  </div>
                </Link>
              ))}
              {(!data?.topAgents || data.topAgents.length === 0) && (
                <p className="text-sm text-zinc-500">
                  No agents yet. Run the demo to populate.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              How It Works
            </h2>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  1
                </span>
                Agents are created with Stellar wallets funded on testnet
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  2
                </span>
                Each agent registers services with USDC pricing
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  3
                </span>
                Agents discover & pay each other via x402 micropayments
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  4
                </span>
                All transactions settle on Stellar with real USDC
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  5
                </span>
                Spending policies & reputation systems add trust guardrails
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
