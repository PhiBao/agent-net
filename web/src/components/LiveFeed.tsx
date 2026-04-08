"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedTransaction {
  id: string;
  amount: number;
  stellarTxHash: string | null;
  status: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string };
  receiver: { id: string; name: string; avatar: string };
  service: { name: string; category: string };
}

export default function LiveFeed({ compact = false }: { compact?: boolean }) {
  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed?limit=20");
      const data = await res.json();
      setTransactions(data);
    } catch {
      // silently retry
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 3000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        <p className="text-lg">No transactions yet</p>
        <p className="mt-1 text-sm">Seed agents and run the demo to see live activity</p>
      </div>
    );
  }

  const displayed = compact ? transactions.slice(0, 8) : transactions;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayed.map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{tx.sender.avatar}</span>
              <div className="text-sm">
                <span className="font-medium text-white">
                  {tx.sender.name}
                </span>
                <span className="mx-2 text-zinc-600">→</span>
                <span className="font-medium text-white">
                  {tx.receiver.name}
                </span>
                <span className="ml-2 text-zinc-500">{tx.receiver.avatar}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                {tx.service.name}
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-400">
                ${tx.amount.toFixed(4)}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  tx.status === "completed" ? "bg-emerald-400" : tx.status === "pending" ? "bg-yellow-400" : "bg-red-400"
                }`}
              />
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
