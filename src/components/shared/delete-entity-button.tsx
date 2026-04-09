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
}: {
  entityName: string;
  endpoint: string;
  redirectTo: string;
  allowedRoles: Role[];
  confirmMessage: string;
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
      <button type="button" onClick={handleDelete} disabled={isDeleting} className="btn-danger">
        <TrashIcon className="mr-1.5 h-4 w-4" />
        {isDeleting ? `Deleting ${entityName}...` : `Delete ${entityName}`}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-status-off-track">{error}</p>
      ) : null}
    </div>
  );
}
