import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  children?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  description,
  createHref,
  createLabel,
  children,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex items-center justify-between gap-2">
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
    </div>
  );
}
