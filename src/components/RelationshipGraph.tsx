import { useEffect, useRef, useState } from 'react';
import type { GraphNode, GraphEdge } from '../lib/types';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const TYPE_COLORS: Record<string, string> = {
  email: '#3b82f6',
  username: '#06b6d4',
  wallet: '#eab308',
  url: '#a855f7',
  alias: '#ec4899',
  phone: '#22c55e',
  ip: '#f97316',
};

function layoutNodes(nodes: GraphNode[], w: number, h: number): GraphNode[] {
  if (nodes.length === 0) return [];
  const cx = w / 2, cy = h / 2;
  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const r = Math.min(w, h) * 0.35;
    return { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

export default function RelationshipGraph({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const [positioned, setPositioned] = useState<GraphNode[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.max(width, 300), h: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPositioned(layoutNodes(nodes, dims.w, dims.h));
  }, [nodes, dims]);

  const nodeMap = new Map(positioned.map(n => [n.id, n]));

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        className="w-full h-full"
      >
        <defs>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <radialGradient key={type} id={`glow-${type}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          if (!src?.x || !tgt?.x) return null;
          return (
            <line
              key={i}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke="rgba(6,182,212,0.2)"
              strokeWidth={e.strength * 2}
              strokeDasharray={e.type === 'co_occurrence' ? '4 4' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {positioned.map(node => {
          const color = TYPE_COLORS[node.type] ?? '#06b6d4';
          const r = 10 + (node.threat_score / 100) * 8;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: node.x!, y: node.y!, node })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle r={r + 6} fill={`url(#glow-${node.type})`} />
              <circle r={r} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
              <circle r={4} fill={color} />
              <text
                y={r + 14}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={9}
                fontFamily="monospace"
              >
                {node.value.length > 16 ? node.value.slice(0, 16) + '…' : node.value}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute z-20 bg-gray-900 border border-cyan-500/30 rounded-lg px-3 py-2 pointer-events-none text-xs font-mono shadow-xl"
          style={{ left: tooltip.x + 20, top: tooltip.y - 20 }}
        >
          <p className="text-cyan-400 font-bold">{tooltip.node.type.toUpperCase()}</p>
          <p className="text-gray-200 mt-0.5">{tooltip.node.value}</p>
          <p className="text-orange-400 mt-0.5">Threat: {tooltip.node.threat_score}</p>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600 font-mono text-sm">NO ENTITIES TO VISUALIZE</p>
        </div>
      )}
    </div>
  );
}
