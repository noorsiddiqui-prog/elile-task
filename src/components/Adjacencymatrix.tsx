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

function confColor(c: number) {
  // red (#ef4444) -> green (#22c55e) interpolation, matching the network view
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * c);
  const from = [239, 68, 68];
  const to = [34, 197, 94];
  return `rgb(${lerp(from[0], to[0])}, ${lerp(from[1], to[1])}, ${lerp(from[2], to[2])})`;
}

function shortLabel(label: string, maxLen = 14) {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "…" : label;
}

export default function AdjacencyMatrix({ data }: Props) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const nodes: GraphNode[] = data.nodes;
  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);

  // confidence[i][j] = edge from node i to node j (directed)
  const size = nodes.length;
  const confidence: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  const indexOf = new Map(nodes.map((n, i) => [n.id, i]));
  data.edges.forEach((e) => {
    const i = indexOf.get(idOf(e.source));
    const j = indexOf.get(idOf(e.target));
    if (i !== undefined && j !== undefined) {
      confidence[i][j] = e.confidence;
    }
  });

  const cellSize = Math.max(34, Math.min(48, Math.floor(440 / size)));
  const labelColWidth = 132;

  return (
    <div style={{ padding: "16px", overflowX: "auto" }}>
      <div style={{ display: "inline-block", minWidth: "100%" }}>

        {/* Column headers */}
        <div style={{ display: "flex", marginLeft: labelColWidth }}>
          {nodes.map((n, j) => {
            const pal = NODE_PALETTE[n.type];
            return (
              <div
                key={n.id}
                style={{
                  width: cellSize, flexShrink: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-end", height: 84, paddingBottom: 6,
                }}
              >
                <div style={{
                  writingMode: "vertical-rl", transform: "rotate(180deg)",
                  fontSize: 10, color: "#64748b", fontFamily: "ui-monospace, monospace",
                  maxHeight: 70, overflow: "hidden", whiteSpace: "nowrap",
                }}>
                  {shortLabel(n.label)}
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: pal.fill,
                  boxShadow: `0 0 4px ${pal.fill}`, marginTop: 4, flexShrink: 0,
                }} />
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {nodes.map((rowNode, i) => {
          const rowPal = NODE_PALETTE[rowNode.type];
          return (
            <div key={rowNode.id} style={{ display: "flex", alignItems: "center" }}>
              {/* Row label */}
              <div style={{
                width: labelColWidth, flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                paddingRight: 10, height: cellSize,
              }}>
                <span style={{ fontSize: 11, color: rowPal.fill, flexShrink: 0 }}>{TYPE_ICON[rowNode.type]}</span>
                <span style={{
                  fontSize: 10.5, color: "#94a3b8", fontFamily: "ui-monospace, monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {shortLabel(rowNode.label)}
                </span>
              </div>

              {/* Cells */}
              {nodes.map((colNode, j) => {
                const c = confidence[i][j];
                const isDiagonal = i === j;
                const isHovered = hovered?.row === i && hovered?.col === j;
                return (
                  <div
                    key={colNode.id}
                    onMouseEnter={() => c !== null && setHovered({ row: i, col: j })}
                    onMouseLeave={() => setHovered(null)}
                    title={c !== null ? `${rowNode.label} → ${colNode.label}: ${Math.round(c * 100)}%` : undefined}
                    style={{
                      width: cellSize, height: cellSize, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isDiagonal
                        ? "#13203580"
                        : c !== null
                          ? `${confColor(c)}${isHovered ? "ff" : "26"}`
                          : "transparent",
                      border: c !== null ? `1px solid ${confColor(c)}${isHovered ? "ff" : "55"}` : "1px solid #1e293b",
                      borderRadius: 6,
                      margin: 2,
                      cursor: c !== null ? "default" : "default",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {c !== null && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                        color: isHovered ? "#ffffff" : confColor(c),
                      }}>
                        {Math.round(c * 100)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9.5, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          Reading the grid
        </span>
        <span style={{ fontSize: 11.5, color: "#64748b" }}>
          Row → column = directed edge confidence. Empty cell = no direct link.
        </span>
      </div>
    </div>
  );
}