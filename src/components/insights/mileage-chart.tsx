import { useMemo } from "react";
import type { MileagePoint } from "@/types/autovault";

export function MileageChart({ data }: { data: MileagePoint[] }) {
  const { path, area, points, min, max } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const w = 100;
    const h = 40;
    const pts = data.map((d, i) => ({
      x: (i / Math.max(1, data.length - 1)) * w,
      y: h - ((d.value - min) / (max - min)) * h,
      ...d,
    }));
    const line = pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1]!;
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
      })
      .join(" ");
    return { path: line, area: `${line} L ${w} ${h} L 0 ${h} Z`, points: pts, min, max };
  }, [data]);

  return (
    <figure className="mt-1">
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="h-[132px] w-full overflow-visible"
        role="img"
        aria-label={`Mileage trend from ${min.toFixed(1)} to ${max.toFixed(1)} km per litre`}
      >
        <defs>
          <linearGradient id="mileage-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mileage-fill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        {points.slice(-1).map((p) => (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="var(--primary)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between px-0.5 text-[11px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}
