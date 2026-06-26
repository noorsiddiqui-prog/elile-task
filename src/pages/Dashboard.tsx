import { useState } from "react";
import type { GraphData, GraphNode } from "../types";
import { exportGraphAsJSON, runAnalysis } from "../utils/graphActions";
import Dashboard from "../components/Dashboard";
import { graphData } from "../config/graphData";

const initialData: GraphData = graphData;

export default function DashboardPage() {
  const [graphData, setGraphData] = useState<GraphData>(initialData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddEntity = (node: GraphNode, linkTo: string | null, confidence: number) => {
    setGraphData((prev) => ({
      nodes: [...prev.nodes, node],
      edges: linkTo
        ? [...prev.edges, { source: linkTo, target: node.id, confidence }]
        : prev.edges,
    }));
  };

  const handleExport = () => {
    exportGraphAsJSON(graphData);
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate processing latency so the action feels real; swap for an
    // actual API call when a backend analysis endpoint exists.
    setTimeout(() => {
      setGraphData((prev) => runAnalysis(prev));
      setIsAnalyzing(false);
    }, 900);
  };

  return (
    <Dashboard
      graphData={graphData}
      onAddEntity={handleAddEntity}
      onExport={handleExport}
      onRunAnalysis={handleRunAnalysis}
      isAnalyzing={isAnalyzing}
    />
  );
}