import Link from "next/link";
import { cn } from "@/lib/utils";
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
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {createHref && (
          <Link href={createHref} className="btn-primary">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            {createLabel || "Create"}
          </Link>
        )}
      </div>
    </div>
  );
}
