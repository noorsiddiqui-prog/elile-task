import { useState } from "react";
import IdentityGraph from "./IdentityGraph";
import type { GraphData } from "../types";
import AddEntityModal from "./AddEntityModal";

interface Props {
  graphData: GraphData;
  onAddEntity: (node: GraphData["nodes"][number], linkTo: string | null, confidence: number) => void;
  onExport: () => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

const NODE_COLORS: Record<string, string> = {
  email:    "#6366f1",
  phone:    "#10b981",
  username: "#f59e0b",
};

const ENTITY_TYPES = [
  { type: "email",    color: "#6366f1", label: "Email" },
  { type: "phone",    color: "#10b981", label: "Phone" },
  { type: "username", color: "#f59e0b", label: "Username" },
] as const;

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "⬡", label: "Identity Graph" },
  { icon: "⇄", label: "Connections" },
  { icon: "↗", label: "Analytics" },
  { icon: "⚙", label: "Settings" },
];

function confColor(c: number) {
  if (c >= 0.85) return "#22c55e";
  if (c >= 0.70) return "#f59e0b";
  return "#ef4444";
}

function shortLabel(id: string, maxLen = 18) {
  const val = id.slice(id.indexOf(":") + 1);
  return val.length > maxLen ? val.slice(0, maxLen - 1) + "…" : val;
}

export default function Dashboard({ graphData, onAddEntity, onExport, onRunAnalysis, isAnalyzing }: Props) {
  const [activeNav, setActiveNav] = useState("Identity Graph");
  const [showAddModal, setShowAddModal] = useState(false);

  const avgConf = Math.round(
    (graphData.edges.reduce((s, e) => s + e.confidence, 0) / graphData.edges.length) * 100
  );

  const typeCounts = graphData.nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  const maxTypeCount = Math.max(...Object.values(typeCounts), 1);

  const STATS = [
    { label: "Total Entities",    value: graphData.nodes.length, unit: "",  color: "#6366f1", icon: "◉" },
    { label: "Connections",       value: graphData.edges.length, unit: "",  color: "#10b981", icon: "⇄" },
    { label: "Identity Clusters", value: 2,                      unit: "",  color: "#f59e0b", icon: "⬡" },
    { label: "Avg Confidence",    value: avgConf,                unit: "%", color: "#22c55e", icon: "✓" },
  ];

  const QUICK_ACTIONS = [
    { icon: "↓", label: "Export Graph",  color: "#6366f1", onClick: onExport,       disabled: false },
    { icon: "+", label: "Add Entity",    color: "#10b981", onClick: () => setShowAddModal(true), disabled: false },
    { icon: "↻", label: isAnalyzing ? "Running…" : "Run Analysis", color: "#f59e0b", onClick: onRunAnalysis, disabled: isAnalyzing },
  ];

  return (
    <div style={{
      display: "flex",
      background: "#080d14",
      minHeight: "100vh",
      color: "#f1f5f9",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "#080d14",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 24,
      }}>
        {/* Brand */}
        <div style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 0 16px #6366f180",
          }}>
            ⬡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3, color: "#f1f5f9", lineHeight: 1.1 }}>IDX</div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 1 }}>Entity Resolution</div>
          </div>
        </div>

        <div style={{ padding: "18px 20px 6px", fontSize: 9.5, color: "#334155", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>
          Navigation
        </div>

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ icon, label }) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 20px",
                  background: isActive ? "#6366f112" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${isActive ? "#6366f1" : "transparent"}`,
                  cursor: "pointer",
                  color: isActive ? "#a5b4fc" : "#475569",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "14px 20px 0", borderTop: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, letterSpacing: 0.5 }}>LIVE</span>
          </div>
          <div style={{ fontSize: 10, color: "#334155" }}>Last updated: just now</div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          borderBottom: "1px solid #1e293b",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#080d14",
          flexShrink: 0,
        }}>
          <span style={{ color: "#334155", fontSize: 13 }}>Entity Resolution</span>
          <span style={{ color: "#1e293b", fontSize: 15 }}>›</span>
          <span style={{ color: "#475569", fontSize: 13 }}>Identity Graph</span>
          <span style={{ color: "#1e293b", fontSize: 15 }}>›</span>
          <span style={{ color: "#64748b", fontSize: 13 }}>Dashboard</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#334155" }}>v2.4.1</span>
            <div style={{ width: 1, height: 14, background: "#1e293b" }} />
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "white",
            }}>AH</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>
              Identity Graph
            </h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 12.5 }}>
              Visualize entity relationships · Scroll to zoom · Drag nodes · Hover for details
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {STATS.map(({ label, value, unit, color, icon }) => (
              <div key={label} style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: "16px 18px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 10.5, color: "#475569", textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 15, color: `${color}66` }}>{icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>
                  {value}<span style={{ fontSize: 14, fontWeight: 600 }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Graph + right panel */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

            {/* Graph panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 12,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#94a3b8" }}>Graph View</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#475569", background: "#1e293b", padding: "3px 8px", borderRadius: 4 }}>Force-directed</span>
                    <span style={{ fontSize: 10, color: "#475569", background: "#1e293b", padding: "3px 8px", borderRadius: 4 }}>D3.js</span>
                  </div>
                </div>
                <IdentityGraph data={graphData} />
              </div>

              {/* Legend */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9.5, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Nodes</span>
                {ENTITY_TYPES.map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>{label}</span>
                  </div>
                ))}
                <div style={{ width: 1, height: 12, background: "#1e293b" }} />
                <span style={{ fontSize: 9.5, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Edges</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 48, height: 3, borderRadius: 2, background: "linear-gradient(to right, #ef4444, #22c55e)" }} />
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>Confidence low → high</span>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ width: 272, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Entity breakdown */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
                  Entity Breakdown
                </div>
                {ENTITY_TYPES.map(({ type, color, label }) => {
                  const count = typeCounts[type] ?? 0;
                  return (
                    <div key={type} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
                        </div>
                        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(count / maxTypeCount) * 100}%`,
                          background: `linear-gradient(90deg, ${color}66, ${color})`,
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connections list */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                  Connections
                </div>
                {graphData.edges.map((edge, i) => {
                  const src = edge.source as string;
                  const tgt = edge.target as string;
                  const srcType = src.split(":")[0];
                  const tgtType = tgt.split(":")[0];
                  const cc = confColor(edge.confidence);
                  return (
                    <div key={i} style={{
                      padding: "9px 0",
                      borderBottom: i < graphData.edges.length - 1 ? "1px solid #1e293b" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, color: NODE_COLORS[srcType] ?? "#64748b", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 2 }}>
                            {srcType}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {shortLabel(src)}
                          </div>
                        </div>
                        <span style={{ color: "#334155", fontSize: 11, flexShrink: 0 }}>→</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, color: NODE_COLORS[tgtType] ?? "#64748b", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 2 }}>
                            {tgtType}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {shortLabel(tgt)}
                          </div>
                        </div>
                        <div style={{
                          flexShrink: 0,
                          fontSize: 10,
                          fontWeight: 700,
                          color: cc,
                          background: `${cc}18`,
                          border: `1px solid ${cc}44`,
                          borderRadius: 4,
                          padding: "2px 6px",
                          fontFamily: "ui-monospace, monospace",
                        }}>
                          {Math.round(edge.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                  Quick Actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {QUICK_ACTIONS.map(({ icon, label, color, onClick, disabled }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      disabled={disabled}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        background: "#080d14",
                        border: "1px solid #1e293b",
                        borderRadius: 7,
                        cursor: disabled ? "default" : "pointer",
                        opacity: disabled ? 0.6 : 1,
                        color: "#64748b",
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color, fontWeight: 700, fontSize: 14, width: 16, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddEntityModal
          existingNodes={graphData.nodes}
          onClose={() => setShowAddModal(false)}
          onAdd={(node, linkTo, confidence) => {
            onAddEntity(node, linkTo, confidence);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}