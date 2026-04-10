"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssignmentFormProps {
  rockId: string;
  users: { id: string; name: string; department: string }[];
}

export function AssignmentForm({ rockId, users }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);

  function toggleContributor(userId: string) {
    setSelectedContributors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

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
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5">
      {error && (
        <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Title</label>
        <input name="title" className="input-field" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Description</label>
        <textarea name="description" className="input-field min-h-[100px]" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Owner</label>
        <select name="ownerId" className="input-field" required>
          <option value="">Select an owner</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Contributors</label>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 rounded p-1.5 hover:bg-background-tertiary cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContributors.includes(u.id)}
                onChange={() => toggleContributor(u.id)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-primary">{u.name}</span>
              <span className="text-xs text-text-tertiary">({u.department})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Due Date</label>
        <input name="dueDate" type="date" className="input-field" />
      </div>

      <div className="flex gap-3 pt-2">
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
