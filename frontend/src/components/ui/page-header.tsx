import type { ReactNode } from "react";

type Props = { eyebrow?: string; title: string; description?: string; actions?: ReactNode };
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 animate-fade-up">
        {eyebrow && (
          <div className="mb-1.5 text-xs font-medium text-muted">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-semibold leading-tight text-ink md:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
