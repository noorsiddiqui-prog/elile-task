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
  if (c >= 0.85) return "#22c55e";
  if (c >= 0.70) return "#f59e0b";
  return "#ef4444";
}

/** Union-find: groups nodes that are connected by any edge (directed or not) into clusters. */
function buildClusters(data: GraphData) {
  const idOf = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);
  const parent = new Map<string, string>();
  data.nodes.forEach((n) => parent.set(n.id, n.id));

  function find(x: string): string {
    while (parent.get(x) !== x) {
      x = parent.get(x)!;
    }
    return x;
  }
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  data.edges.forEach((e) => union(idOf(e.source), idOf(e.target)));

  const groups = new Map<string, GraphNode[]>();
  data.nodes.forEach((n) => {
    const root = find(n.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(n);
  });

  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  return Array.from(groups.values()).map((members) => {
    const memberIds = new Set(members.map((m) => m.id));
    const internalEdges = data.edges.filter(
      (e) => memberIds.has(idOf(e.source)) && memberIds.has(idOf(e.target))
    );
    const avgConfidence = internalEdges.length
      ? internalEdges.reduce((s, e) => s + e.confidence, 0) / internalEdges.length
      : 0;
    return { members, internalEdges, avgConfidence, idOf, nodeById };
  });
}

export default function ClusterView({ data }: Props) {
  const clusters = buildClusters(data).sort((a, b) => b.members.length - a.members.length);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {clusters.map((cluster, ci) => {
        const cc = confColor(cluster.avgConfidence || 0.5);
        return (
          <div
            key={ci}
            style={{
              background: "#080d14",
              border: `1px solid ${cc}33`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            {/* Cluster header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: cc, boxShadow: `0 0 6px ${cc}`,
                }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0" }}>
                  Identity cluster {ci + 1}
                </span>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  · {cluster.members.length} {cluster.members.length === 1 ? "entity" : "entities"}
                </span>
              </div>
              {cluster.internalEdges.length > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, color: cc, background: `${cc}18`,
                  border: `1px solid ${cc}44`, borderRadius: 4, padding: "2px 8px",
                  fontFamily: "ui-monospace, monospace",
                }}>
                  {Math.round(cluster.avgConfidence * 100)}% avg confidence
                </span>
              )}
            </div>

            {/* Member chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: cluster.internalEdges.length ? 12 : 0 }}>
              {cluster.members.map((m) => {
                const pal = NODE_PALETTE[m.type];
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#0f172a", border: `1px solid ${pal.fill}44`,
                      borderRadius: 7, padding: "6px 10px",
                    }}
                  >
                    <span style={{ fontSize: 11, color: pal.fill }}>{TYPE_ICON[m.type]}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Internal links */}
            {cluster.internalEdges.length > 0 && (
              <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {cluster.internalEdges.map((e, ei) => {
                  const s = cluster.nodeById.get(cluster.idOf(e.source));
                  const t = cluster.nodeById.get(cluster.idOf(e.target));
                  if (!s || !t) return null;
                  const ec = confColor(e.confidence);
                  return (
                    <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span style={{ color: "#64748b", fontFamily: "ui-monospace, monospace" }}>{s.label}</span>
                      <span style={{ color: "#334155" }}>→</span>
                      <span style={{ color: "#64748b", fontFamily: "ui-monospace, monospace" }}>{t.label}</span>
                      <span style={{ marginLeft: "auto", color: ec, fontFamily: "monospace", fontWeight: 700 }}>
                        {Math.round(e.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}