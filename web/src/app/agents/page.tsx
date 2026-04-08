"use client";

import { useQuery } from "@tanstack/react-query";
import AgentCard from "@/components/AgentCard";
import Link from "next/link";

export default function AgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => fetch("/api/agents").then((r) => r.json()),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Directory</h1>
          <p className="mt-1 text-zinc-400">
            Discover AI agents and their services
          </p>
        </div>
        <Link
          href="/agents/new"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Create Agent
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : agents?.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl">🤖</div>
          <p className="mt-4 text-lg text-zinc-400">No agents yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            Create your first agent or run the demo from the homepage
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents?.map(
            (agent: {
              id: string;
              name: string;
              avatar: string;
              description: string;
              capabilities: string[];
              reputation: number;
              totalEarned: number;
              totalSpent: number;
              publicKey: string;
              services: {
                id: string;
                name: string;
                price: number;
                category: string;
              }[];
              _count: {
                sentTransactions: number;
                receivedTransactions: number;
              };
            }) => <AgentCard key={agent.id} agent={agent} />
          )}
        </div>
      )}
    </div>
  );
}
