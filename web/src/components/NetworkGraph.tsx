"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface GraphNode {
  id: string;
  name: string;
  avatar: string;
  val: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface FeedTransaction {
  id: string;
  amount: number;
  status: string;
  sender: { id: string; name: string; avatar: string };
  receiver: { id: string; name: string; avatar: string };
  service: { name: string; category: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  "web-search": "#8b5cf6",
  "data-analysis": "#06b6d4",
  "content-writing": "#10b981",
  "code-review": "#f59e0b",
  "price-oracle": "#ef4444",
  "sentiment-analysis": "#ec4899",
  default: "#6366f1",
};

export default function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [ForceGraph, setForceGraph] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    import("react-force-graph-2d").then((mod) => {
      setForceGraph(() => mod.default);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/feed?limit=100");
      const transactions: FeedTransaction[] = await res.json();

      const nodeMap = new Map<string, GraphNode>();
      const links: GraphLink[] = [];

      for (const tx of transactions) {
        if (tx.status !== "completed") continue;

        if (!nodeMap.has(tx.sender.id)) {
          nodeMap.set(tx.sender.id, {
            id: tx.sender.id,
            name: tx.sender.name,
            avatar: tx.sender.avatar,
            val: 5,
            color: "#8b5cf6",
          });
        }
        if (!nodeMap.has(tx.receiver.id)) {
          nodeMap.set(tx.receiver.id, {
            id: tx.receiver.id,
            name: tx.receiver.name,
            avatar: tx.receiver.avatar,
            val: 5,
            color: "#06b6d4",
          });
        }

        const senderNode = nodeMap.get(tx.sender.id)!;
        senderNode.val += 2;
        const receiverNode = nodeMap.get(tx.receiver.id)!;
        receiverNode.val += 3;

        links.push({
          source: tx.sender.id,
          target: tx.receiver.id,
          value: tx.amount * 100,
          color:
            CATEGORY_COLORS[tx.service.category] || CATEGORY_COLORS.default,
        });
      }

      setGraphData({
        nodes: Array.from(nodeMap.values()),
        links,
      });
    } catch {
      // retry
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!ForceGraph || graphData.nodes.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
        <div className="text-center">
          <div className="text-4xl">🕸️</div>
          <p className="mt-2 text-sm text-zinc-500">
            {graphData.nodes.length === 0
              ? "Run the demo to see the agent network"
              : "Loading graph..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950"
    >
      <ForceGraph
        graphData={graphData}
        width={containerRef.current?.clientWidth || 800}
        height={500}
        backgroundColor="#09090b"
        nodeLabel={(node: Record<string, unknown>) =>
          `${node.avatar} ${node.name}`
        }
        nodeColor={(node: Record<string, unknown>) => node.color as string}
        nodeRelSize={4}
        linkColor={(link: Record<string, unknown>) => link.color as string}
        linkWidth={(link: Record<string, unknown>) =>
          Math.max(1, (link.value as number) / 2)
        }
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link: Record<string, unknown>) =>
          link.color as string
        }
        nodeCanvasObject={(
          node: Record<string, unknown>,
          ctx: CanvasRenderingContext2D,
          globalScale: number
        ) => {
          const x = node.x as number;
          const y = node.y as number;
          const label = node.name as string;
          const avatar = node.avatar as string;
          const size = Math.sqrt(node.val as number) * 3;

          // Glow
          ctx.beginPath();
          ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = `${node.color as string}33`;
          ctx.fill();

          // Node
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = node.color as string;
          ctx.fill();
          ctx.strokeStyle = "#ffffff22";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Emoji
          ctx.font = `${Math.max(10, size)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(avatar, x, y);

          // Label
          if (globalScale > 0.8) {
            ctx.font = `${Math.max(3, 12 / globalScale)}px sans-serif`;
            ctx.fillStyle = "#e4e4e7";
            ctx.fillText(label, x, y + size + 8 / globalScale);
          }
        }}
        nodePointerAreaPaint={(
          node: Record<string, unknown>,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const size = Math.sqrt(node.val as number) * 3;
          ctx.beginPath();
          ctx.arc(
            node.x as number,
            node.y as number,
            size + 4,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = color;
          ctx.fill();
        }}
      />
    </div>
  );
}
