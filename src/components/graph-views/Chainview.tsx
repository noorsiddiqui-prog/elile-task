import type { GraphData, GraphNode } from "../../types";

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
  if (c >= 0.85) return "#22c55e";
  if (c >= 0.70) return "#f59e0b";
  return "#ef4444";
}

function NodeChip({ node }: { node: GraphNode }) {
  const pal = NODE_PALETTE[node.type];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "#0f172a", border: `1px solid ${pal.fill}44`,
      borderRadius: 7, padding: "6px 10px", flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: pal.fill }}>{TYPE_ICON[node.type]}</span>
      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>
        {node.label}
      </span>
    </div>
  );
}

export default function ChainView({ data }: Props) {
  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <div style={{ padding: "16px 16px 8px" }}>
      <div style={{
        fontSize: 11, color: "#475569", marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>Step order reflects how each link was added to the graph, not a real timestamp.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {data.edges.map((e, i) => {
          const s = nodeById.get(idOf(e.source));
          const t = nodeById.get(idOf(e.target));
          if (!s || !t) return null;
          const ec = confColor(e.confidence);
          const isLast = i === data.edges.length - 1;

          return (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              {/* Step marker + connecting rail */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 26 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: "#0f172a",
                  border: `1.5px solid ${ec}`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: ec, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: 28, background: "#1e293b", marginTop: 2, marginBottom: 2 }} />
                )}
              </div>

              {/* Step content */}
              <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <NodeChip node={s} />
                  <span style={{ color: "#334155", fontSize: 13 }}>→</span>
                  <NodeChip node={t} />
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: ec, background: `${ec}18`,
                    border: `1px solid ${ec}44`, borderRadius: 4, padding: "2px 8px",
                    fontFamily: "ui-monospace, monospace",
                  }}>
                    {Math.round(e.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}