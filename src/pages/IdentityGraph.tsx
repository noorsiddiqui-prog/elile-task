import IdentityGraph from "../components/IdentityGraph";
import type { GraphData } from "../types";

const graphData: GraphData = {
  nodes: [
    { id: "email:ahmed@gmail.com",       type: "email",    label: "ahmed@gmail.com" },
    { id: "phone:+971501234567",          type: "phone",    label: "+971 50 123 4567" },
    { id: "username:ahmed_uae",           type: "username", label: "ahmed_uae" },
    { id: "email:a.hassan@outlook.com",   type: "email",    label: "a.hassan@outlook.com" },
    { id: "username:hassan_99",           type: "username", label: "hassan_99" },
    { id: "phone:+971509876543",          type: "phone",    label: "+971 50 987 6543" },
  ],
  edges: [
    { source: "email:ahmed@gmail.com",      target: "phone:+971501234567",        confidence: 0.95 },
    { source: "email:ahmed@gmail.com",      target: "username:ahmed_uae",         confidence: 0.88 },
    { source: "phone:+971501234567",        target: "email:a.hassan@outlook.com", confidence: 0.72 },
    { source: "email:a.hassan@outlook.com", target: "username:hassan_99",         confidence: 0.91 },
    { source: "username:hassan_99",         target: "phone:+971509876543",        confidence: 0.65 },
  ],
};

const NODE_TYPES = [
  { color: "#6366f1", label: "Email" },
  { color: "#10b981", label: "Phone" },
  { color: "#f59e0b", label: "Username" },
];

const STATS = [
  { value: "6", label: "Entities",    color: "#6366f1" },
  { value: "5", label: "Connections", color: "#10b981" },
  { value: "2", label: "Identities",  color: "#f59e0b" },
];

function GraphPage() {
  return (
    <div style={{ background: "#080d14", minHeight: "100vh", color: "#f1f5f9", fontFamily: "system-ui, sans-serif", textAlign: "left" }}>

      {/* Top nav bar */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "14px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, boxShadow: "0 0 12px #6366f160",
        }}>
          ⬡
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.2, color: "#f1f5f9" }}>IDX</span>
        <span style={{ color: "#1e293b", margin: "0 2px", fontSize: 16 }}>›</span>
        <span style={{ color: "#475569", fontSize: 13 }}>Entity Resolution</span>
        <span style={{ color: "#1e293b", margin: "0 2px", fontSize: 16 }}>›</span>
        <span style={{ color: "#64748b", fontSize: 13 }}>Identity Graph</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, letterSpacing: 0.5 }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding: "24px 28px 32px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: "0 0 5px", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>
              Identity Graph
            </h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5 }}>
              Scroll to zoom · Drag nodes to rearrange · Hover for details
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATS.map(({ value, label, color }) => (
              <div key={label} style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "8px 14px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 10.5, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph canvas */}
        <IdentityGraph data={graphData} />

        {/* Legend row */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Nodes
          </span>
          {NODE_TYPES.map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: "#1e293b" }} />
          <span style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Edges
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 56, height: 3, borderRadius: 2, background: "linear-gradient(to right, #ef4444, #22c55e)" }} />
            <span style={{ fontSize: 12, color: "#64748b" }}>Confidence low → high</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GraphPage;
