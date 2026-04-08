"use client";

import { useQuery } from "@tanstack/react-query";

interface Stats {
  stats: {
    totalAgents: number;
    totalServices: number;
    totalTransactions: number;
    totalVolume: number;
  };
}

export default function StatsBar() {
  const { data } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => fetch("/api/stats").then((r) => r.json()),
  });

  const stats = data?.stats;

  const items = [
    { label: "Agents", value: stats?.totalAgents ?? 0, icon: "🤖" },
    { label: "Services", value: stats?.totalServices ?? 0, icon: "⚡" },
    { label: "Transactions", value: stats?.totalTransactions ?? 0, icon: "💸" },
    {
      label: "Volume (USDC)",
      value: `$${(stats?.totalVolume ?? 0).toFixed(2)}`,
      icon: "📊",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
        >
          <div className="text-2xl">{item.icon}</div>
          <div className="mt-1 text-2xl font-bold text-white">{item.value}</div>
          <div className="text-xs text-zinc-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
