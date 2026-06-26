import { useState } from "react";
import type { GraphData, GraphNode } from "../types";

interface Props {
  data: GraphData;
}

const NODE_PALETTE: Record<string, { fill: string; light: string }> = {
  email:    { fill: "#6366f1", light: "#a5b4fc" },
  phone:    { fill: "#10b981", light: "#6ee7b7" },
  username: { fill: "#f59e0b", light: "#fcd34d" },
};

const TYPE_ICON: Record<string, string> = { email: "✉", phone: "✆", username: "#" };

const SIZE = 360;
const CX = SIZE / 2;
const CY = SIZE / 2;
const INNER_R0 = 36;
const INNER_R1 = 78;
const OUTER_R0 = 86;
const OUTER_R1 = 140;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [x0o, y0o] = polar(cx, cy, r1, a0);
  const [x1o, y1o] = polar(cx, cy, r1, a1);
  const [x0i, y0i] = polar(cx, cy, r0, a1);
  const [x1i, y1i] = polar(cx, cy, r0, a0);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${x0o} ${y0o}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${r0} ${r0} 0 ${largeArc} 0 ${x1i} ${y1i}`,
    "Z",
  ].join(" ");
}

export default function SunburstView({ data }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);
  const degree = new Map<string, number>();
  data.edges.forEach((e) => {
    const s = idOf(e.source);
    const t = idOf(e.target);
    degree.set(s, (degree.get(s) ?? 0) + 1);
    degree.set(t, (degree.get(t) ?? 0) + 1);
  });

  const byType = new Map<string, GraphNode[]>();
  data.nodes.forEach((n) => {
    if (!byType.has(n.type)) byType.set(n.type, []);
    byType.get(n.type)!.push(n);
  });

  const types = Array.from(byType.keys());
  const total = data.nodes.length;

  let cursor = 0;
  const typeSegments = types.map((type) => {
    const members = byType.get(type)!;
    const span = (members.length / total) * 360;
    const seg = { type, members, a0: cursor, a1: cursor + span };
    cursor += span;
    return seg;
  });

  const hoveredNode = hoveredId ? data.nodes.find((n) => n.id === hoveredId) ?? null : null;

  return (
    <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
        {typeSegments.map((seg) => {
          const pal = NODE_PALETTE[seg.type];
          const midAngle = (seg.a0 + seg.a1) / 2;
          const [lx, ly] = polar(CX, CY, (INNER_R0 + INNER_R1) / 2, midAngle);

          let memberCursor = seg.a0;
          const gap = 1.2;

          return (
            <g key={seg.type}>
              {/* Inner ring: type segment */}
              <path
                d={arcPath(CX, CY, INNER_R0, INNER_R1, seg.a0 + gap / 2, seg.a1 - gap / 2)}
                fill={pal.fill}
                fillOpacity={0.85}
                stroke="#080d14"
                strokeWidth={1.5}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize={13} fill="white" fontWeight="bold"
              >
                {TYPE_ICON[seg.type]}
              </text>

              {/* Outer ring: individual entities */}
              {seg.members.map((m) => {
                const span = (seg.a1 - seg.a0) / seg.members.length;
                const a0 = memberCursor + 0.6;
                const a1 = memberCursor + span - 0.6;
                memberCursor += span;
                const isHovered = hoveredId === m.id;
                const deg = degree.get(m.id) ?? 0;
                const r1 = OUTER_R0 + ((OUTER_R1 - OUTER_R0) * Math.min(deg, 3)) / 3;

                return (
                  <path
                    key={m.id}
                    d={arcPath(CX, CY, OUTER_R0, r1, a0, a1)}
                    fill={pal.light}
                    fillOpacity={isHovered ? 1 : 0.55}
                    stroke="#080d14"
                    strokeWidth={1.5}
                    style={{ cursor: "default", transition: "fill-opacity 0.15s" }}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Center label */}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={20} fontWeight="800" fill="#f1f5f9">
          {total}
        </text>
        <text x={CX} y={CY + 13} textAnchor="middle" fontSize={9} fill="#475569" letterSpacing={0.5}>
          ENTITIES
        </text>
      </svg>

      {/* Side panel: legend + hover detail */}
      <div style={{ minWidth: 180, flex: 1 }}>
        <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
          By type
        </div>
        {typeSegments.map((seg) => {
          const pal = NODE_PALETTE[seg.type];
          return (
            <div key={seg.type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pal.fill, boxShadow: `0 0 4px ${pal.fill}` }} />
              <span style={{ fontSize: 12, color: "#94a3b8", textTransform: "capitalize" }}>{seg.type}</span>
              <span style={{ fontSize: 12, color: pal.fill, fontWeight: 700, marginLeft: "auto" }}>{seg.members.length}</span>
            </div>
          );
        })}

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e293b", minHeight: 56 }}>
          {hoveredNode ? (
            <>
              <div style={{ fontSize: 9, color: NODE_PALETTE[hoveredNode.type].fill, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>
                {hoveredNode.type}
              </div>
              <div style={{ fontSize: 12.5, color: "#e2e8f0", fontFamily: "ui-monospace, monospace", marginBottom: 4 }}>
                {hoveredNode.label}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {degree.get(hoveredNode.id) ?? 0} connection{(degree.get(hoveredNode.id) ?? 0) === 1 ? "" : "s"}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11.5, color: "#475569" }}>
              Hover a segment to see entity details. Outer-ring thickness scales with connection count.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}