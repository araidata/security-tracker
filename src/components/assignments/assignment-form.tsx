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
    <form onSubmit={handleSubmit} className="card w-full space-y-6">
      {error && (
        <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section>
        <SectionHeader title="Basic Info" />
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Title
            </label>
            <input name="title" className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Description
            </label>
            <textarea name="description" className="input-field min-h-[80px]" />
          </div>
        </div>
      </section>

      {/* Ownership */}
      <section>
        <SectionHeader title="Ownership" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Owner
            </label>
            <select name="ownerId" className="input-field" required>
              <option value="">Select an owner</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Due Date
            </label>
            <input name="dueDate" type="date" className="input-field" />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Contributors
          </label>
          <div className="space-y-2">
            {selectedContributors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedContributors.map((id) => {
                  const u = users.find((u) => u.id === id)!;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent"
                    >
                      {u.name}
                      <button
                        type="button"
                        onClick={() => toggleContributor(id)}
                        className="hover:text-accent/70"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <input
              type="text"
              placeholder="Search contributors..."
              value={contributorSearch}
              onChange={(e) => setContributorSearch(e.target.value)}
              className="input-field"
            />
            {contributorSearch && (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2">
                {filteredUsers.length === 0 && (
                  <span className="text-xs text-text-tertiary">No matches</span>
                )}
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      toggleContributor(u.id);
                      setContributorSearch("");
                    }}
                    className="rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                  >
                    {u.name}{" "}
                    <span className="text-text-tertiary">({u.department})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-3 border-t border-border pt-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Create Assignment"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
