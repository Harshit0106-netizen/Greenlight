import { cn } from "@/lib/cn";

const palette = ["bg-brand/15 text-brand", "bg-info/15 text-info", "bg-success/15 text-success", "bg-warning/15 text-warning", "bg-danger/15 text-danger"];
export const initials = (name: string) => name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const tone = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", tone, className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }} aria-hidden>
      {initials(name)}
    </span>
  );
}
