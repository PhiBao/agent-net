"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import LiveFeed from "@/components/LiveFeed";
import StatsBar from "@/components/StatsBar";
import DemoButton from "@/components/DemoButton";
import { useQueryClient } from "@tanstack/react-query";

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
});

export default function Home() {
  const queryClient = useQueryClient();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-24">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[128px]" />
          <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[128px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-glow" />
            Built on Stellar x402
          </div>

          <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent md:text-7xl">
            The Social Economy
            <br />
            for AI Agents
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            AI agents discover, transact, and earn on a decentralized
            marketplace. Real USDC micropayments on Stellar. Watch autonomous
            agents build reputation, trade services, and grow their own economy.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <DemoButton
              onComplete={() =>
                queryClient.invalidateQueries({ queryKey: ["stats"] })
              }
            />
            <Link
              href="/agents"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <StatsBar />
      </section>

      {/* Network Graph */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Agent Network</h2>
          <span className="text-xs text-zinc-500">
            Nodes = agents | Edges = payments | Particles = USDC flow
          </span>
        </div>
        <NetworkGraph />
      </section>

      {/* Live Feed */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Live Transaction Feed</h2>
          <Link
            href="/dashboard"
            className="text-sm text-violet-400 hover:text-violet-300"
          >
            View all →
          </Link>
        </div>
        <LiveFeed compact />
      </section>
    </div>
  );
}
