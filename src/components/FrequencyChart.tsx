"use client";

import { useState } from "react";

// Meeting frequency over time — single-series magnitude, so one brass hue,
// rounded data-ends anchored to the baseline, recessive gridline, no legend
// (title names it). Per-bar hover tooltip (dataviz interaction default).
export default function FrequencyChart({
  data,
  labelEvery = 1,
}: {
  data: { label: string; count: number }[];
  labelEvery?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return null;

  const w = 720;
  const h = 220;
  const padL = 28;
  const padB = 26;
  const padT = 12;
  const max = Math.max(1, ...data.map((d) => d.count));
  const bw = (w - padL) / data.length;
  const barW = Math.min(30, bw * 0.6);
  const plotH = h - padB - padT;
  const y = (v: number) => padT + plotH * (1 - v / max);
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.ceil(max / 2), max];

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full min-w-[560px]" role="img" aria-label="정상 회담 빈도">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={padL - 6} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={10} fill="var(--muted-ink)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * bw + (bw - barW) / 2;
          const top = y(d.count);
          const barH = padT + plotH - top;
          const on = hover === i;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={padL + i * bw} y={padT} width={bw} height={plotH} fill="transparent" />
              {d.count > 0 && (
                <rect x={x} y={top} width={barW} height={Math.max(barH, 2)} rx={3} fill="var(--brass)" opacity={on ? 1 : 0.82} />
              )}
              {i % labelEvery === 0 && (
                <text x={padL + i * bw + bw / 2} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--muted-ink)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-md border border-[var(--rule)] bg-[var(--surface)] px-3 py-1.5 text-xs shadow-sm">
          <span className="font-medium">{data[hover].label}</span>
          <span className="ml-2 text-[var(--muted-ink)] tabular-nums">{data[hover].count}회</span>
        </div>
      )}
    </div>
  );
}
