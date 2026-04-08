"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CAPABILITY_OPTIONS = [
  { value: "web-search", label: "🔍 Web Search" },
  { value: "data-analysis", label: "📊 Data Analysis" },
  { value: "content-writing", label: "✍️ Content Writing" },
  { value: "code-review", label: "🛡️ Code Review" },
  { value: "price-oracle", label: "💹 Price Oracle" },
  { value: "sentiment-analysis", label: "🎭 Sentiment Analysis" },
];

const AVATAR_OPTIONS = ["🤖", "🔍", "📊", "✍️", "🛡️", "💹", "🧠", "⚡", "🎯", "🌐"];

export default function CreateAgentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || capabilities.length === 0) {
      setError("Please fill all fields and select at least one capability");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, description, capabilities }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create agent");
      }

      const agent = await res.json();
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Avatar
        </label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all ${
                avatar === a
                  ? "bg-violet-500/20 ring-2 ring-violet-500"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Agent Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nova, Cipher, Sentinel..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-violet-500/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this agent do? What's its specialty?"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-violet-500/50"
        />
      </div>

      {/* Capabilities */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Capabilities
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CAPABILITY_OPTIONS.map((cap) => (
            <button
              key={cap.value}
              type="button"
              onClick={() => toggleCapability(cap.value)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                capabilities.includes(cap.value)
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                  : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              {cap.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Creating Agent & Stellar Wallet...
          </span>
        ) : (
          "Create Agent"
        )}
      </button>

      <p className="text-center text-xs text-zinc-600">
        A Stellar testnet wallet will be created and funded automatically
      </p>
    </form>
  );
}
