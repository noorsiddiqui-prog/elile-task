import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode } from "../types";

interface Props {
  data: GraphData;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

const NODE_PALETTE = {
  email:    { fill: "#6366f1", light: "#a5b4fc", dark: "#3730a3" },
  phone:    { fill: "#10b981", light: "#6ee7b7", dark: "#065f46" },
  username: { fill: "#f59e0b", light: "#fcd34d", dark: "#92400e" },
} as const;

const confidenceColor = (c: number) =>
  d3.interpolateRgb("#ef4444", "#22c55e")(c);

const WIDTH = 960;
const HEIGHT = 580;

const NODE_RADIUS = 27;      // matches the main circle's r
const ARROW_GAP = 0;         // marker's own refX (8) already provides the tip offset

const curvePath = (sx: number, sy: number, tx: number, ty: number) => {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return "";
  // Clip end-point to node boundary (+ tiny gap) so the small arrow tip sits right at the node edge
  const ex = tx - (dx / len) * (NODE_RADIUS + ARROW_GAP);
  const ey = ty - (dy / len) * (NODE_RADIUS + ARROW_GAP);
  const mx = (sx + ex) / 2 - (ey - sy) * 0.2;
  const my = (sy + ey) / 2 + (ex - sx) * 0.2;
  return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
};

const IdentityGraph: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, node: null,
  });

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Dot grid background pattern
    const pat = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 28).attr("height", 28)
      .attr("patternUnits", "userSpaceOnUse");
    pat.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 1).attr("fill", "#1e293b");

    // Per-type: radial gradient + glow filter
    (Object.keys(NODE_PALETTE) as Array<keyof typeof NODE_PALETTE>).forEach((type) => {
      const p = NODE_PALETTE[type];

      const g = defs.append("radialGradient")
        .attr("id", `g-${type}`)
        .attr("cx", "38%").attr("cy", "35%").attr("r", "65%");
      g.append("stop").attr("offset", "0%").attr("stop-color", p.light);
      g.append("stop").attr("offset", "100%").attr("stop-color", p.fill);

      const f = defs.append("filter")
        .attr("id", `glow-${type}`)
        .attr("x", "-60%").attr("y", "-60%")
        .attr("width", "220%").attr("height", "220%");
      f.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "6").attr("result", "blur");
      const merge = f.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Drop shadow
    const shadow = defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-40%").attr("y", "-40%")
      .attr("width", "180%").attr("height", "180%");
    shadow.append("feDropShadow")
      .attr("dx", 0).attr("dy", 3)
      .attr("stdDeviation", 5)
      .attr("flood-color", "rgba(0,0,0,0.6)");

    // Arrow marker — small but visible triangle, fixed cyan accent regardless of edge color
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -4 9 9")
      .attr("refX", 8).attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 9).attr("markerHeight", 9)
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M 0,-4 L 8,0 L 0,4 Z")
      .attr("fill", "#22d3ee")
      .attr("stroke", "none");

    // Canvas background
    svg.append("rect").attr("width", WIDTH).attr("height", HEIGHT).attr("fill", "#080d14");
    svg.append("rect").attr("width", WIDTH).attr("height", HEIGHT).attr("fill", "url(#grid)");

    const container = svg.append("g");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 5])
        .on("zoom", (event) => container.attr("transform", event.transform))
    );

    const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }));
    const edges = data.edges.map((e) => ({ ...e }));

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-750))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collision", d3.forceCollide(60));

    // Curved edge paths
    const links = container.append("g")
      .selectAll("path")
      .data(edges).enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", (d) => confidenceColor(d.confidence))
      .attr("stroke-opacity", (d) => 0.35 + d.confidence * 0.55)
      .attr("stroke-width", (d) => 1.5 + d.confidence * 4)
      .attr("marker-end", "url(#arrow)");

    // Confidence pills on edges
    const pills = container.append("g")
      .selectAll("g")
      .data(edges).enter()
      .append("g");

    pills.append("rect")
      .attr("rx", 8).attr("width", 36).attr("height", 17)
      .attr("x", -18).attr("y", -8.5)
      .attr("fill", "#0f172a")
      .attr("stroke", (d) => confidenceColor(d.confidence))
      .attr("stroke-width", 1);

    pills.append("text")
      .text((d) => `${Math.round(d.confidence * 100)}%`)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("font-size", 9).attr("font-weight", "700").attr("font-family", "monospace")
      .attr("fill", (d) => confidenceColor(d.confidence));

    // Node groups
    const nodeGroups = container.append("g")
      .selectAll("g")
      .data(nodes).enter()
      .append("g")
      .style("cursor", "grab")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event: any, d: any) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // Ambient halo
    nodeGroups.append("circle").attr("class", "halo")
      .attr("r", 42)
      .attr("fill", (d) => NODE_PALETTE[d.type].fill)
      .attr("fill-opacity", 0.07)
      .attr("stroke", (d) => NODE_PALETTE[d.type].fill)
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", 1);

    // Main filled circle
    nodeGroups.append("circle").attr("class", "main-circle")
      .attr("r", NODE_RADIUS)
      .attr("fill", (d) => `url(#g-${d.type})`)
      .attr("filter", "url(#shadow)")
      .attr("stroke", (d) => NODE_PALETTE[d.type].light)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5);

    // Type icon
    nodeGroups.append("text")
      .text((d) => d.type === "email" ? "✉" : d.type === "phone" ? "✆" : "#")
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("font-size", 15).attr("fill", "white").attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Label pill below node
    const labelG = nodeGroups.append("g")
      .attr("transform", "translate(0,45)")
      .style("pointer-events", "none");

    labelG.append("rect").attr("rx", 4).attr("height", 18).attr("y", -9)
      .attr("fill", "#0f172a").attr("fill-opacity", 0.9)
      .attr("stroke", "#1e293b").attr("stroke-width", 1)
      .each(function (d) {
        const w = Math.max(d.label.length * 6.8 + 18, 60);
        d3.select(this).attr("width", w).attr("x", -w / 2);
      });

    labelG.append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("font-size", 10.5).attr("fill", "#94a3b8")
      .attr("font-family", "ui-monospace, monospace");

    // Hover: glow on / off
    nodeGroups
      .on("mouseenter", (event: MouseEvent, d: GraphNode) => {
        d3.select(event.currentTarget as Element)
          .select(".main-circle")
          .attr("filter", `url(#glow-${d.type})`)
          .attr("stroke-opacity", 1);
        d3.select(event.currentTarget as Element)
          .select(".halo")
          .attr("fill-opacity", 0.15)
          .attr("stroke-opacity", 0.35);
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ visible: true, x: event.clientX - rect.left, y: event.clientY - rect.top - 58, node: d });
      })
      .on("mousemove", (event: MouseEvent) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip((p) => ({ ...p, x: event.clientX - rect.left, y: event.clientY - rect.top - 58 }));
      })
      .on("mouseleave", (event: MouseEvent) => {
        d3.select(event.currentTarget as Element)
          .select(".main-circle")
          .attr("filter", "url(#shadow)")
          .attr("stroke-opacity", 0.5);
        d3.select(event.currentTarget as Element)
          .select(".halo")
          .attr("fill-opacity", 0.07)
          .attr("stroke-opacity", 0.15);
        setTooltip((p) => ({ ...p, visible: false }));
      });

    simulation.on("tick", () => {
      links.attr("d", (d: any) => curvePath(d.source.x, d.source.y, d.target.x, d.target.y));

      pills.attr("transform", (d: any) => {
        const mx = (d.source.x + d.target.x) / 2 - (d.target.y - d.source.y) * 0.09;
        const my = (d.source.y + d.target.y) / 2 + (d.target.x - d.source.x) * 0.09;
        return `translate(${mx},${my})`;
      });

      nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", boxShadow: "0 0 0 1px #1e293b, 0 24px 64px rgba(0,0,0,0.5)" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {tooltip.visible && tooltip.node && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
            background: "#0f172a",
            border: `1px solid ${NODE_PALETTE[tooltip.node.type].fill}55`,
            borderRadius: 8,
            padding: "7px 12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 20,
            boxShadow: `0 0 0 1px ${NODE_PALETTE[tooltip.node.type].fill}22, 0 8px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase", color: NODE_PALETTE[tooltip.node.type].light,
            display: "block", marginBottom: 2,
          }}>
            {tooltip.node.type}
          </span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#e2e8f0" }}>
            {tooltip.node.id.slice(tooltip.node.id.indexOf(":") + 1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default IdentityGraph;