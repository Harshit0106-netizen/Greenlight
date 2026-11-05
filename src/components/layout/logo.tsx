import { cn } from "@/lib/cn";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="gl-g" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a99fff" /><stop offset=".55" stopColor="#7664ff" /><stop offset="1" stopColor="#52d7e8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill="#141c33" />
      <path d="M32 8 49 15v14c0 12-7.4 21.4-17 27-9.6-5.6-17-15-17-27V15L32 8Z" fill="url(#gl-g)" />
      <path d="m23 31 6 6 13-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
