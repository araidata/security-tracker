"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

type Role = "EXECUTIVE" | "MANAGER" | "CONTRIBUTOR";

export function DeleteEntityButton({
  entityName,
  endpoint,
  redirectTo,
  allowedRoles,
  confirmMessage,
  compact = false,
}: {
  entityName: string;
  endpoint: string;
  redirectTo: string;
  allowedRoles: Role[];
  confirmMessage: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const userRole = session?.user?.role as Role | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  async function handleDelete() {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to delete ${entityName.toLowerCase()}.`);
      }

      router.push(redirectTo);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : `Unable to delete ${entityName.toLowerCase()}.`
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={
          compact
            ? "inline-flex items-center justify-center rounded-full border border-status-off-track/30 bg-status-off-track px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-status-off-track transition-colors duration-hover hover:bg-status-off-track/20 disabled:cursor-not-allowed disabled:opacity-50"
            : "btn-danger"
        }
      >
        <TrashIcon className="mr-1 h-3.5 w-3.5" />
        {isDeleting ? (compact ? "Deleting" : `Deleting ${entityName}...`) : compact ? "Delete" : `Delete ${entityName}`}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-status-off-track">{error}</p>
      ) : null}
    </div>
  );
}
