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
    <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
