import type { GraphData, GraphEdge } from "../types";

/**
 * Triggers a browser download of the current graph as a JSON file.
 */
export function exportGraphAsJSON(data: GraphData, filename = "identity-graph.json") {
  const serializable: GraphData = {
    nodes: data.nodes.map(({ id, type, label }) => ({ id, type, label })),
    edges: data.edges.map((e) => ({
      source: typeof e.source === "string" ? e.source : e.source.id,
      target: typeof e.target === "string" ? e.target : e.target.id,
      confidence: e.confidence,
    })),
  };

  const blob = new Blob([JSON.stringify(serializable, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Lightweight re-analysis pass: nudges each edge's confidence based on simple
 * structural signals (how many entities the two endpoints jointly connect to).
 * This stands in for a real entity-resolution model — it's deterministic and
 * bounded, so re-running it without changing the graph won't drift values
 * outside a believable range.
 */
export function runAnalysis(data: GraphData): GraphData {
  const idOf = (n: string | { id: string }) => (typeof n === "string" ? n : n.id);

  const neighborCount = new Map<string, number>();
  for (const e of data.edges) {
    const s = idOf(e.source);
    const t = idOf(e.target);
    neighborCount.set(s, (neighborCount.get(s) ?? 0) + 1);
    neighborCount.set(t, (neighborCount.get(t) ?? 0) + 1);
  }

  const updatedEdges: GraphEdge[] = data.edges.map((e) => {
    const s = idOf(e.source);
    const t = idOf(e.target);
    const sharedSignal = Math.min((neighborCount.get(s) ?? 1) + (neighborCount.get(t) ?? 1), 8) / 8;
    // Blend existing confidence with the structural signal, clamped to a sane range
    const blended = e.confidence * 0.8 + sharedSignal * 0.2;
    const clamped = Math.min(0.98, Math.max(0.4, blended));
    return { ...e, confidence: Math.round(clamped * 100) / 100 };
  });

  return { nodes: data.nodes, edges: updatedEdges };
}