"use client";

import { useState } from "react";
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate, formatPercent } from "@/lib/utils";

type Confidence = "HIGH" | "MEDIUM" | "LOW";

interface UpdateRow {
  id: string;
  weekOf: Date | string;
  completionPct: number;
  confidenceLevel: Confidence;
  progressNotes: string;
  blockers: string | null;
  needsAttention: boolean;
  author: { name: string };
}

const CONF_LABEL: Record<Confidence, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const CONF_CLS: Record<Confidence, string> = {
  HIGH: "text-emerald-500",
  MEDIUM: "text-amber-500",
  LOW: "text-red-500",
};

export function WeeklyUpdatesTable({
  rockId,
  initialUpdates,
}: {
  rockId: string;
  initialUpdates: UpdateRow[];
}) {
  const [updates, setUpdates] = useState<UpdateRow[]>(initialUpdates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<UpdateRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(u: UpdateRow) {
    setEditingId(u.id);
    setEditState({
      completionPct: u.completionPct,
      confidenceLevel: u.confidenceLevel,
      progressNotes: u.progressNotes,
      blockers: u.blockers ?? "",
      needsAttention: u.needsAttention,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({});
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/rocks/${rockId}/updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionPct: editState.completionPct,
          confidenceLevel: editState.confidenceLevel,
          progressNotes: editState.progressNotes || "-",
          blockers: editState.blockers || undefined,
          needsAttention: editState.needsAttention,
        }),
      });
      if (res.ok) {
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  completionPct: editState.completionPct ?? u.completionPct,
                  confidenceLevel: (editState.confidenceLevel as Confidence) ?? u.confidenceLevel,
                  progressNotes: editState.progressNotes ?? u.progressNotes,
                  blockers: (editState.blockers as string) || null,
                  needsAttention: editState.needsAttention ?? u.needsAttention,
                }
              : u
          )
        );
        setEditingId(null);
        setEditState({});
      }
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUpdate(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/rocks/${rockId}/updates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUpdates((prev) => prev.filter((u) => u.id !== id));
        setConfirmDeleteId(null);
      }
    } finally {
      setSavingId(null);
    }
  }

  if (updates.length === 0) {
    return <p className="py-3 text-center text-sm text-text-tertiary">No updates yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-background-secondary/60">
            <th className="px-3 py-2 text-left font-medium text-text-tertiary whitespace-nowrap">Date</th>
            <th className="px-3 py-2 text-right font-medium text-text-tertiary">%</th>
            <th className="px-3 py-2 text-left font-medium text-text-tertiary">Confidence</th>
            <th className="px-3 py-2 text-left font-medium text-text-tertiary">Notes</th>
            <th className="px-3 py-2 text-left font-medium text-text-tertiary">Blockers</th>
            <th className="px-3 py-2 text-center font-medium text-text-tertiary">Attn</th>
            <th className="px-3 py-2 text-left font-medium text-text-tertiary">By</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {updates.map((u) => {
            const isEditing = editingId === u.id;
            const isDeleting = confirmDeleteId === u.id;
            const isBusy = savingId === u.id;

            return (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background-secondary/30">
                <td className="px-3 py-1.5 whitespace-nowrap text-text-secondary">
                  {formatDate(u.weekOf)}
                </td>

                {/* % */}
                <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editState.completionPct ?? u.completionPct}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, completionPct: Number(e.target.value) }))
                      }
                      className="h-8 w-14 rounded border border-border bg-background px-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  ) : (
                    formatPercent(u.completionPct)
                  )}
                </td>

                {/* Confidence */}
                <td className="px-3 py-1.5">
                  {isEditing ? (
                    <select
                      value={editState.confidenceLevel ?? u.confidenceLevel}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, confidenceLevel: e.target.value as Confidence }))
                      }
                      className="h-8 rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  ) : (
                    <span className={`font-medium ${CONF_CLS[u.confidenceLevel]}`}>
                      {CONF_LABEL[u.confidenceLevel]}
                    </span>
                  )}
                </td>

                {/* Notes */}
                <td className="px-3 py-1.5 max-w-[220px]">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editState.progressNotes ?? u.progressNotes}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, progressNotes: e.target.value }))
                      }
                      className="h-8 w-52 rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <span className="block truncate text-text-primary">{u.progressNotes}</span>
                  )}
                </td>

                {/* Blockers */}
                <td className="px-3 py-1.5 max-w-[180px]">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editState.blockers ?? u.blockers ?? ""}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, blockers: e.target.value }))
                      }
                      placeholder="None"
                      className="h-8 w-40 rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <span className={`block truncate ${u.blockers ? "text-status-blocked" : "text-text-tertiary"}`}>
                      {u.blockers || "—"}
                    </span>
                  )}
                </td>

                {/* Needs Attention */}
                <td className="px-3 py-1.5 text-center">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={editState.needsAttention ?? u.needsAttention}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, needsAttention: e.target.checked }))
                      }
                      className="h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                  ) : u.needsAttention ? (
                    <span className="font-bold text-status-off-track">!</span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>

                {/* Author */}
                <td className="px-3 py-1.5 text-text-tertiary whitespace-nowrap">{u.author.name}</td>

                {/* Actions */}
                <td className="px-3 py-1.5">
                  {isDeleting ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-text-tertiary">Delete?</span>
                      <button
                        type="button"
                        onClick={() => deleteUpdate(u.id)}
                        disabled={isBusy}
                        className="rounded p-0.5 text-status-off-track hover:bg-status-off-track/10"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded p-0.5 text-text-tertiary hover:bg-background-tertiary"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => saveEdit(u.id)}
                        disabled={isBusy}
                        className="rounded p-0.5 text-emerald-500 hover:bg-emerald-500/10"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded p-0.5 text-text-tertiary hover:bg-background-tertiary"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [tr:hover_&]:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="rounded p-0.5 text-text-tertiary hover:text-text-primary"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(u.id)}
                        className="rounded p-0.5 text-text-tertiary hover:text-status-off-track"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
