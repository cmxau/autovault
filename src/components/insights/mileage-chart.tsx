import { useMemo, useState, type PointerEvent } from "react";
import type { MileagePoint } from "@/types/autovault";

export function MileageChart({
  data,
  formatValue = (v) => v.toFixed(1),
}: {
  data: MileagePoint[];
  formatValue?: (value: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { path, area, points, min, max, avgY, labelled } = useMemo(() => {
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
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    // Label every point when there are few; otherwise just the latest, best and lowest.
    const labelled = new Set(
      data.length <= 6
        ? data.map((_, i) => i)
        : [
            data.length - 1,
            values.indexOf(Math.max(...values)),
            values.indexOf(Math.min(...values)),
          ],
    );
    return {
      path: line,
      area: `${line} L ${w} ${h} L 0 ${h} Z`,
      points: pts,
      min,
      max,
      avgY: h - ((avg - min) / (max - min)) * h,
      labelled,
    };
  }, [data]);

  const active = activeIndex === null ? undefined : points[activeIndex];

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setActiveIndex(Math.round(ratio * (points.length - 1)));
  };

  return (
    <figure>
      <div
        className="relative mt-6 touch-pan-y"
        onPointerDown={track}
        onPointerMove={track}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActiveIndex(null)}
      >
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
          <line
            x1="0"
            x2="100"
            y1={avgY}
            y2={avgY}
            stroke="var(--muted-foreground)"
            strokeOpacity="0.45"
            strokeDasharray="3 3"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
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
        {points.map((p, i) => (
          <span
            key={p.label}
            aria-hidden
            className={
              i === points.length - 1
                ? "pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
                : "pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            }
            style={{ left: `${p.x}%`, top: `${(p.y / 40) * 100}%` }}
          />
        ))}
        {!active &&
          points.map(
            (p, i) =>
              labelled.has(i) && (
                <span
                  key={`v-${p.label}`}
                  aria-hidden
                  className="tnum pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap pb-2 text-[11px] font-medium text-foreground/80"
                  style={{
                    left: `clamp(8%, ${p.x}%, 92%)`,
                    top: `${(p.y / 40) * 100}%`,
                  }}
                >
                  {formatValue(p.value)}
                </span>
              ),
          )}
        {active && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 h-full w-px bg-primary/30"
              style={{ left: `${active.x}%` }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
              style={{ left: `${active.x}%`, top: `${(active.y / 40) * 100}%` }}
            />
            <div
              role="status"
              className="tnum pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] bg-card px-2.5 py-1.5 text-center shadow-[0_2px_8px_-2px_var(--hairline)] ring-1 ring-inset ring-hairline"
              style={{ left: `clamp(15%, ${active.x}%, 85%)` }}
            >
              <p className="text-[13px] font-semibold leading-tight">{formatValue(active.value)}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{active.label}</p>
            </div>
          </>
        )}
      </div>
      <figcaption className="mt-2 flex justify-between px-0.5 text-[11px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}
