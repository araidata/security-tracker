"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-0.5 flex items-center gap-1 text-xs text-text-tertiary">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRightIcon className="h-3 w-3 shrink-0 text-text-disabled" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors hover:text-text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-secondary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
