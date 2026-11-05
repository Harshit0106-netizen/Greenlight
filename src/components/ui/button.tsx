import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-sm"
};
const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink shadow-sm hover:bg-brand-strong hover:shadow-glow",
  secondary: "border border-line bg-surface text-ink hover:border-brand/40 hover:bg-soft",
  ghost: "text-muted hover:bg-soft hover:text-ink",
  danger: "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15"
};

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) =>
  cn("inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50", sizes[size], variants[variant], extra);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, disabled, className, children, type = "button", ...props }, ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...props}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
});
