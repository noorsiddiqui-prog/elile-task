import { useState } from "react";
import type { EntityType, GraphNode } from "../types";

interface Props {
  existingNodes: GraphNode[];
  onClose: () => void;
  onAdd: (node: GraphNode, linkTo: string | null, confidence: number) => void;
}

const TYPE_OPTIONS: { type: EntityType; label: string; placeholder: string; color: string }[] = [
  { type: "email",    label: "Email",    placeholder: "name@example.com",   color: "#6366f1" },
  { type: "phone",    label: "Phone",    placeholder: "+971 50 123 4567",   color: "#10b981" },
  { type: "username", label: "Username", placeholder: "username",          color: "#f59e0b" },
];

export default function AddEntityModal({ existingNodes, onClose, onAdd }: Props) {
  const [type, setType] = useState<EntityType>("email");
  const [value, setValue] = useState("");
  const [linkTo, setLinkTo] = useState<string>("");
  const [confidence, setConfidence] = useState(75);
  const [error, setError] = useState<string | null>(null);

  const selected = TYPE_OPTIONS.find((t) => t.type === type)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a value for this entity.");
      return;
    }
    const id = `${type}:${trimmed}`;
    if (existingNodes.some((n) => n.id === id)) {
      setError("This entity already exists in the graph.");
      return;
    }
    onAdd(
      { id, type, label: trimmed },
      linkTo || null,
      confidence / 100
    );
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 20,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: 380, background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 14, padding: "20px 22px", color: "#f1f5f9",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add entity</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent", border: "none", color: "#475569",
              fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {TYPE_OPTIONS.map((opt) => {
            const active = opt.type === type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => setType(opt.type)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: `1px solid ${active ? opt.color : "#1e293b"}`,
                  background: active ? `${opt.color}18` : "#080d14",
                  color: active ? opt.color : "#64748b",
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Value input */}
        <label style={{ display: "block", fontSize: 11.5, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {selected.label} value
        </label>
        <input
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          placeholder={selected.placeholder}
          style={{
            width: "100%", boxSizing: "border-box", padding: "9px 12px",
            background: "#080d14", border: "1px solid #1e293b", borderRadius: 8,
            color: "#f1f5f9", fontSize: 13, fontFamily: "ui-monospace, monospace",
            marginBottom: 14, outline: "none",
          }}
        />

        {/* Link to existing node */}
        {existingNodes.length > 0 && (
          <>
            <label style={{ display: "block", fontSize: 11.5, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Link to existing entity (optional)
            </label>
            <select
              value={linkTo}
              onChange={(e) => setLinkTo(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "9px 12px",
                background: "#080d14", border: "1px solid #1e293b", borderRadius: 8,
                color: "#f1f5f9", fontSize: 13, marginBottom: 14, outline: "none",
              }}
            >
              <option value="">No link</option>
              {existingNodes.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>

            {linkTo && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Confidence
                  </label>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>{confidence}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #1e293b",
              background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
              background: "#6366f1", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Add entity
          </button>
        </div>
      </form>
    </div>
  );
}