import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode } from "../types";

interface Props {
  data: GraphData;
}

const NODE_PALETTE = {
  email:    { fill: "#6366f1", light: "#a5b4fc" },
  phone:    { fill: "#10b981", light: "#6ee7b7" },
  username: { fill: "#f59e0b", light: "#fcd34d" },
} as const;

const TYPE_ICON: Record<string, string> = { email: "✉", phone: "✆", username: "#" };

function confColor(c: number) {
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * c);
  const from = [239, 68, 68];
  const to = [34, 197, 94];
  return `rgb(${lerp(from[0], to[0])}, ${lerp(from[1], to[1])}, ${lerp(from[2], to[2])})`;
}

const NODE_R = 26;
const LEVEL_GAP = 110;
const COL_GAP = 150;
const PAD = 60;
const ARROW_GAP = 7;

/** Assigns each node a depth (level) via BFS from root nodes (no incoming edge). Cycles fall back to insertion order. */
function layoutLevels(data: GraphData) {
  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();

  data.nodes.forEach((n) => { incoming.set(n.id, 0); adj.set(n.id, []); });
  data.edges.forEach((e) => {
    const s = idOf(e.source);
    const t = idOf(e.target);
    incoming.set(t, (incoming.get(t) ?? 0) + 1);
    adj.get(s)?.push(t);
  });

  const roots = data.nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);
  const startIds = roots.length > 0 ? roots : [data.nodes[0]?.id].filter(Boolean) as string[];

  const depth = new Map<string, number>();
  const queue: string[] = [];
  startIds.forEach((id) => { depth.set(id, 0); queue.push(id); });

  while (queue.length) {
    const cur = queue.shift()!;
    const d = depth.get(cur)!;
    for (const next of adj.get(cur) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }

  // Any node never reached (disconnected) gets appended at depth 0
  data.nodes.forEach((n) => { if (!depth.has(n.id)) depth.set(n.id, 0); });

  const levels = new Map<number, string[]>();
  data.nodes.forEach((n) => {
    const d = depth.get(n.id)!;
    if (!levels.has(d)) levels.set(d, []);
    levels.get(d)!.push(n.id);
  });

  const maxLevelSize = Math.max(...Array.from(levels.values()).map((l) => l.length), 1);
  const width = PAD * 2 + (maxLevelSize - 1) * COL_GAP;
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
  const height = PAD * 2 + sortedLevels.length * LEVEL_GAP - (sortedLevels.length > 0 ? LEVEL_GAP - 60 : 0);

  const positions = new Map<string, { x: number; y: number }>();
  sortedLevels.forEach((lvl, li) => {
    const ids = levels.get(lvl)!;
    const rowWidth = (ids.length - 1) * COL_GAP;
    const startX = (width - rowWidth) / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: startX + i * COL_GAP, y: PAD + li * LEVEL_GAP });
    });
  });

  return { positions, nodeById, width, height: Math.max(height, PAD * 2 + 60) };
}

function edgePath(sx: number, sy: number, tx: number, ty: number) {
  const midY = (sy + ty) / 2;
  return `M ${sx} ${sy + NODE_R} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty - NODE_R - ARROW_GAP}`;
}

export default function TreeView({ data }: Props) {
  const { positions, nodeById, width, height } = useMemo(() => layoutLevels(data), [data]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomGroupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform.toString());
      });

    svg.call(zoomBehavior);

    return () => {
      svg.on(".zoom", null);
    };
  }, [width, height]);

  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);

  return (
    <div style={{ position: "relative", padding: "16px", overflowX: "auto" }}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", minWidth: Math.min(width, 600), touchAction: "none" }}
      >
        <defs>
          <marker id="tree-arrow" viewBox="0 -4 9 9" refX="8" refY="0" orient="auto" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse">
            <path d="M 0,-4 L 8,0 L 0,4 Z" fill="#22d3ee" stroke="none" />
          </marker>
        </defs>

        <g ref={zoomGroupRef}>

        {/* Edges */}
        {data.edges.map((e, i) => {
          const s = positions.get(idOf(e.source));
          const t = positions.get(idOf(e.target));
          if (!s || !t) return null;
          const ec = confColor(e.confidence);
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          return (
            <g key={i}>
              <path
                d={edgePath(s.x, s.y, t.x, t.y)}
                fill="none"
                stroke={ec}
                strokeOpacity={0.35 + e.confidence * 0.55}
                strokeWidth={1.5 + e.confidence * 3}
                markerEnd="url(#tree-arrow)"
              />
              <rect x={midX - 18} y={midY - 8.5} width={36} height={17} rx={8} fill="#0f172a" stroke={ec} strokeWidth={1} />
              <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fontFamily="monospace" fill={ec}>
                {Math.round(e.confidence * 100)}%
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {data.nodes.map((n) => {
          const pos = positions.get(n.id);
          if (!pos) return null;
          const pal = NODE_PALETTE[n.type];
          return (
            <g
              key={n.id}
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: "default" }}
            >
              <circle r={NODE_R + 10} fill={pal.fill} fillOpacity={0.08} stroke={pal.fill} strokeOpacity={0.15} />
              <circle r={NODE_R} fill={pal.fill} stroke={pal.light} strokeWidth={1.5} strokeOpacity={0.6} />
              <title>{`${n.type}: ${n.label}`}</title>
              <text textAnchor="middle" dominantBaseline="central" fontSize={14} fill="white" fontWeight="bold">
                {TYPE_ICON[n.type]}
              </text>
              <rect x={-Math.max(n.label.length * 3.4 + 10, 30)} y={NODE_R + 8} width={Math.max(n.label.length * 6.8 + 20, 60)} height={18} rx={4} fill="#0f172a" fillOpacity={0.9} stroke="#1e293b" strokeWidth={1} />
              <text y={NODE_R + 17} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fill="#94a3b8" fontFamily="ui-monospace, monospace">
                {n.label}
              </text>
            </g>
          );
        })}

        </g>
      </svg>

      <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
        Top-down by resolution order: roots are entities with no incoming link. Scroll or pinch to zoom.
      </div>
    </div>
  );
}