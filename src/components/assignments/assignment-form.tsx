"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssignmentFormProps {
  rockId: string;
  users: { id: string; name: string; department: string }[];
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 border-b border-border pb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </span>
    </div>
  );
}

export function AssignmentForm({ rockId, users }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [contributorSearch, setContributorSearch] = useState("");

  function toggleContributor(userId: string) {
    setSelectedContributors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      !selectedContributors.includes(u.id) &&
      u.name.toLowerCase().includes(contributorSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      dueDate: formData.get("dueDate") || undefined,
      rockId,
      ownerId: formData.get("ownerId"),
      contributorIds: selectedContributors.length > 0 ? selectedContributors : undefined,
    };

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ? JSON.stringify(err.error) : "Failed to save");
      }

      router.push(`/rocks/${rockId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full space-y-3">
      {error && (
        <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
          {error}
        </div>
      )}

      {/* Row 1: Title (2/3) | Due Date (1/3) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-text-secondary">Title *</label>
          <input name="title" className="input-field" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Due Date</label>
          <input name="dueDate" type="date" className="input-field" />
        </div>
      </div>

      {/* Row 2: Description (2/3) | Owner (1/3) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-text-secondary">Description</label>
          <textarea name="description" className="input-field min-h-[68px]" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Owner *</label>
          <select name="ownerId" className="input-field" required>
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Contributors (full width) */}
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Contributors</label>

        {/* Selected chips */}
        {selectedContributors.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {selectedContributors.map((id) => {
              const u = users.find((u) => u.id === id)!;
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  {u.name}
                  <button type="button" onClick={() => toggleContributor(id)} className="hover:text-accent/70 leading-none">×</button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Filter contributors..."
          value={contributorSearch}
          onChange={(e) => setContributorSearch(e.target.value)}
          className="input-field mb-1"
        />

        {/* Always-visible scrollable list */}
        <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-background/60 p-1">
          {filteredUsers.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-text-tertiary">No users available</p>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleContributor(u.id)}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary"
              >
                <span>{u.name}</span>
                <span className="text-text-tertiary">{u.department}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t border-border pt-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Create Assignment"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
