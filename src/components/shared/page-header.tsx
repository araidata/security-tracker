import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  createHref,
  createLabel,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h1 className="text-base font-semibold tracking-tight text-text-primary">{title}</h1>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}
        {createHref && (
          <Link href={createHref} className="btn-primary">
            <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
            {createLabel || "Create"}
          </Link>
        )}
      </div>
    </div>
  );
}
