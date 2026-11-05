"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export const scoreTone = (v: number) => (v >= 80 ? "text-success" : v >= 55 ? "text-warning" : "text-danger");

type Props = { value: number; size?: number; stroke?: number; label?: string; className?: string };
/** Animated circular score. Colour follows the value; SVG only, no chart dependency. */
export function ScoreRing({ value, size = 120, stroke = 10, label, className }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(value)); return () => cancelAnimationFrame(t); }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const small = size < 70;
  return (
    <div className={cn("relative shrink-0", scoreTone(value), className)} style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"} ${value} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke="currentColor"
          strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold tracking-tight text-ink", small ? "text-sm" : "text-3xl")}>{value}</span>
        {label && !small && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>}
      </div>
    </div>
  );
}
