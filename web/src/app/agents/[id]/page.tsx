"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface AgentDetail {
  id: string;
  name: string;
  avatar: string;
  description: string;
  capabilities: string[];
  publicKey: string;
  reputation: number;
  totalEarned: number;
  totalSpent: number;
  maxPerTx: number;
  dailyBudget: number;
  createdAt: string;
  balance: { xlm: string; usdc: string };
  explorerUrl: string;
  services: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    totalCalls: number;
  }[];
  sentTransactions: {
    id: string;
    amount: number;
    stellarTxHash: string | null;
    status: string;
    taskDescription: string;
    createdAt: string;
    receiver: { id: string; name: string; avatar: string };
    service: { name: string; category: string };
  }[];
  receivedTransactions: {
    id: string;
    amount: number;
    stellarTxHash: string | null;
    status: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string };
    service: { name: string; category: string };
  }[];
}

export default function AgentProfilePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [taskInput, setTaskInput] = useState("");

  const { data: agent, isLoading } = useQuery<AgentDetail>({
    queryKey: ["agent", id],
    queryFn: () => fetch(`/api/agents/${id}`).then((r) => r.json()),
  });

  const executeMutation = useMutation({
    mutationFn: (task: string) =>
      fetch(`/api/agents/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    },
  });

  const policyMutation = useMutation({
    mutationFn: (data: { maxPerTx?: number; dailyBudget?: number }) =>
      fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="py-20 text-center text-zinc-400">Agent not found</div>
    );
  }

  const pnl = agent.totalEarned - agent.totalSpent;
  const allTx = [
    ...agent.sentTransactions.map((t) => ({ ...t, type: "sent" as const })),
    ...agent.receivedTransactions.map((t) => ({ ...t, type: "received" as const })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-5xl">
          {agent.avatar}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
          <p className="mt-1 text-zinc-400">{agent.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
        <a
          href={agent.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
        >
          View on Stellar ↗
        </a>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Reputation", value: agent.reputation.toFixed(1), icon: "⭐" },
          { label: "USDC Balance", value: `$${parseFloat(agent.balance.usdc).toFixed(2)}`, icon: "💰" },
          { label: "Total Earned", value: `$${agent.totalEarned.toFixed(2)}`, icon: "📈" },
          { label: "Total Spent", value: `$${agent.totalSpent.toFixed(2)}`, icon: "📉" },
          {
            label: "P&L",
            value: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
            icon: pnl >= 0 ? "🟢" : "🔴",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
          >
            <div className="text-xl">{stat.icon}</div>
            <div className="mt-1 text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Services + Execute */}
        <div className="space-y-6 lg:col-span-2">
          {/* Execute Task */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Execute Task
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="e.g. Research AI agent trends on Stellar..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
              />
              <button
                onClick={() => {
                  if (taskInput.trim()) {
                    executeMutation.mutate(taskInput);
                    setTaskInput("");
                  }
                }}
                disabled={executeMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {executeMutation.isPending ? "Running..." : "Execute"}
              </button>
            </div>
            {executeMutation.data && (
              <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                {executeMutation.data.finalResult || executeMutation.data.error}
              </div>
            )}
          </div>

          {/* Services */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Services ({agent.services.length})
            </h2>
            {agent.services.length === 0 ? (
              <p className="text-sm text-zinc-500">No services registered</p>
            ) : (
              <div className="space-y-3">
                {agent.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4"
                  >
                    <div>
                      <h3 className="font-medium text-white">{svc.name}</h3>
                      <p className="text-sm text-zinc-500">{svc.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-emerald-400">
                        ${svc.price.toFixed(4)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {svc.totalCalls} calls
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Transaction History ({allTx.length})
            </h2>
            <div className="space-y-2">
              {allTx.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        tx.type === "sent"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {tx.type === "sent" ? "SENT" : "RECV"}
                    </span>
                    <div className="text-sm">
                      <span className="text-zinc-300">
                        {tx.type === "sent"
                          ? `→ ${"receiver" in tx ? (tx as { receiver: { name: string } }).receiver.name : ""}`
                          : `← ${"sender" in tx ? (tx as { sender: { name: string } }).sender.name : ""}`}
                      </span>
                      <span className="ml-2 text-zinc-600">
                        {tx.service.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-zinc-300">
                      ${tx.amount.toFixed(4)}
                    </span>
                    {tx.stellarTxHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        tx↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {allTx.length === 0 && (
                <p className="text-sm text-zinc-500">No transactions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Spending Policy + Wallet */}
        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Wallet</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-zinc-500">Public Key</div>
                <div className="mt-1 break-all font-mono text-xs text-zinc-300">
                  {agent.publicKey}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">XLM</span>
                <span className="font-mono text-sm text-white">
                  {parseFloat(agent.balance.xlm).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">USDC</span>
                <span className="font-mono text-sm text-emerald-400">
                  ${parseFloat(agent.balance.usdc).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Spending Policy */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Spending Policy
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Max per transaction (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={agent.maxPerTx}
                  onBlur={(e) =>
                    policyMutation.mutate({
                      maxPerTx: parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Daily budget (USDC)
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={agent.dailyBudget}
                  onBlur={(e) =>
                    policyMutation.mutate({
                      dailyBudget: parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>
              {policyMutation.isPending && (
                <p className="text-xs text-violet-400">Updating...</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Links</h2>
            <div className="space-y-2">
              <a
                href={agent.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-white/5 bg-white/[0.01] p-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                🔭 Stellar Explorer
              </a>
              <Link
                href="/agents"
                className="block rounded-lg border border-white/5 bg-white/[0.01] p-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                📋 Agent Directory
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-lg border border-white/5 bg-white/[0.01] p-3 text-sm text-zinc-300 hover:bg-white/5"
              >
                📊 Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
