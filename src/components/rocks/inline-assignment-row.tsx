"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export interface AssignmentRow {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  owner: { id: string; name: string };
  contributors: { user: { name: string } }[];
}

interface User {
  id: string;
  name: string;
}

interface InlineAssignmentRowProps {
  assignment: AssignmentRow;
  users: User[];
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
];

export function InlineAssignmentRow({ assignment, users }: InlineAssignmentRowProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Optimistic display state
  const [display, setDisplay] = useState<AssignmentRow>(assignment);

  // Draft while editing
  const [draft, setDraft] = useState({
    title: assignment.title,
    ownerId: assignment.owner.id,
    dueDate: assignment.dueDate ? String(assignment.dueDate).slice(0, 10) : "",
    status: assignment.status,
  });

  function startEdit() {
    setDraft({
      title: display.title,
      ownerId: display.owner.id,
      dueDate: display.dueDate ? String(display.dueDate).slice(0, 10) : "",
      status: display.status,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  const commitSave = useCallback(
    async (d: typeof draft) => {
      if (!d.title.trim()) return;

      const newOwner = users.find((u) => u.id === d.ownerId) ?? display.owner;

      // Optimistic update
      setDisplay((prev) => ({
        ...prev,
        title: d.title,
        status: d.status,
        dueDate: d.dueDate || null,
        owner: newOwner,
      }));
      setEditing(false);
      setSaving(true);

      try {
        const res = await fetch(`/api/assignments/${assignment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: d.title,
            ownerId: d.ownerId,
            dueDate: d.dueDate || undefined,
            status: d.status,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        router.refresh();
      } catch {
        // Revert on failure
        setDisplay(assignment);
        setEditing(true);
      } finally {
        setSaving(false);
      }
    },
    [assignment, users, display.owner, router],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitSave(draft);
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  // Save when focus leaves the entire edit container
  function handleContainerBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      commitSave(draft);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${display.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/assignments/${assignment.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  if (deleting) {
    return (
      <div className="flex h-9 items-center rounded-lg border border-border px-3 text-xs text-text-tertiary opacity-40">
        Deleting…
      </div>
    );
  }

  if (editing) {
    return (
      <div
        ref={containerRef}
        onBlur={handleContainerBlur}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 rounded-lg border border-accent/40 bg-background-secondary/60 px-2 py-1.5"
      >
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          placeholder="Title"
        />
        <select
          value={draft.ownerId}
          onChange={(e) => setDraft((p) => ({ ...p, ownerId: e.target.value }))}
          className="inline-edit-select shrink-0 bg-transparent text-xs text-text-secondary"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={draft.dueDate}
          onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))}
          className="w-28 shrink-0 bg-transparent text-xs text-text-secondary outline-none"
        />
        <select
          value={draft.status}
          onChange={(e) =>
            setDraft((p) => ({ ...p, status: e.target.value as TaskStatus }))
          }
          className="inline-edit-select shrink-0 bg-transparent text-xs text-text-secondary"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => commitSave(draft)}
          disabled={saving}
          className="btn-xs shrink-0"
        >
          <CheckIcon className="h-3 w-3" />
        </button>
        <button type="button" onClick={cancelEdit} className="btn-xs shrink-0">
          <XMarkIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border px-2 py-1.5 transition-colors hover:border-border-strong hover:bg-background-tertiary/30">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
        {display.title}
      </p>
      <span className="shrink-0 text-xs text-text-tertiary">{display.owner.name}</span>
      {display.contributors.length > 0 && (
        <span className="shrink-0 text-xs text-text-tertiary">
          +{display.contributors.length}
        </span>
      )}
      {display.dueDate && (
        <span className="shrink-0 text-xs text-text-tertiary">
          {formatDate(display.dueDate as string)}
        </span>
      )}
      <TaskStatusBadge status={display.status} compact />
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={startEdit} className="btn-xs">
          <PencilIcon className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="btn-xs text-status-off-track hover:bg-status-off-track/10"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </div>
      {saving && <span className="text-[10px] text-text-tertiary">Saving…</span>}
    </div>
  );
}
