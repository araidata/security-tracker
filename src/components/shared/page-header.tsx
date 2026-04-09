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
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow">Operations Intelligence</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-[2.5rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
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
