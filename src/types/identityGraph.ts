import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: "email" | "phone" | "username";
  label: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  confidence: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type EntityType = "email" | "phone" | "username";
