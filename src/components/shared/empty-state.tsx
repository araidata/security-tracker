import { InboxIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-background-secondary/65 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
        <InboxIcon className="h-5 w-5 text-text-tertiary" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-5 text-text-secondary">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-3">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
