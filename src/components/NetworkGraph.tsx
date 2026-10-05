"use client";

import { useMemo, useState } from "react";
import type { NetEdge, NetNode } from "@/lib/aggregate";

// Relationship network: countries on a ring, edge thickness ∝ summit frequency
// (single-hue magnitude, per dataviz). Hover a country to isolate its ties.
export default function NetworkGraph({
  nodes,
  edges,
}: {
  nodes: NetNode[];
  edges: NetEdge[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<NetEdge | null>(null);

  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 74;
  const maxW = Math.max(1, ...edges.map((e) => e.weight));

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number; a: number }>();
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      m.set(n.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a });
    });
    return m;
  }, [nodes, cx, cy, r]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto block h-auto w-full max-w-[560px]"
        role="img"
        aria-label="국가 간 양자·소다자 정상회담 관계 네트워크"
      >
        {/* edges */}
        <g>
          {edges.map((e) => {
            const pa = pos.get(e.a);
            const pb = pos.get(e.b);
            if (!pa || !pb) return null;
            const isActive = !active || e.a === active || e.b === active;
            const w = 1 + (e.weight / maxW) * 5;
            return (
              <line
                key={`${e.a}-${e.b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="var(--brass)"
                strokeWidth={w}
                strokeLinecap="round"
                opacity={isActive ? 0.28 + 0.5 * (e.weight / maxW) : 0.05}
                onMouseEnter={() => setHoverEdge(e)}
                onMouseLeave={() => setHoverEdge(null)}
                style={{ cursor: "pointer", transition: "opacity .15s" }}
              />
            );
          })}
        </g>
        {/* nodes */}
        <g>
          {nodes.map((n) => {
            const p = pos.get(n.id)!;
            const isActive = !active || active === n.id ||
              edges.some((e) => (e.a === active && e.b === n.id) || (e.b === active && e.a === n.id));
            const labelX = cx + (r + 26) * Math.cos(p.a);
            const labelY = cy + (r + 26) * Math.sin(p.a);
            const anchor = Math.cos(p.a) > 0.2 ? "start" : Math.cos(p.a) < -0.2 ? "end" : "middle";
            return (
              <g
                key={n.id}
                opacity={isActive ? 1 : 0.25}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
                style={{ cursor: "pointer", transition: "opacity .15s" }}
              >
                <circle cx={p.x} cy={p.y} r={13} fill="var(--node)" stroke="var(--node-ring)" strokeWidth={1.5} />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={15}>
                  {n.flag}
                </text>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fontSize={11}
                  fill="var(--muted-ink)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {n.name_ko}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* edge tooltip */}
      {hoverEdge && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md border border-[var(--rule)] bg-[var(--surface)] px-3 py-1.5 text-xs shadow-sm">
          <span className="font-medium">
            {nodeById.get(hoverEdge.a)?.flag} {nodeById.get(hoverEdge.a)?.name_ko}
            {" · "}
            {nodeById.get(hoverEdge.b)?.flag} {nodeById.get(hoverEdge.b)?.name_ko}
          </span>
          <span className="ml-2 text-[var(--muted-ink)]">
            {hoverEdge.weight}회 · ~{hoverEdge.lastDate.slice(0, 4)}
          </span>
        </div>
      )}
    </div>
  );
}
