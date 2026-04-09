"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";

export default function NewWeeklyUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const rockId = params.rockId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default to most recent Monday
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const defaultWeekOf = monday.toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      weekOf: formData.get("weekOf") as string,
      progressNotes: formData.get("progressNotes") as string,
      blockers: formData.get("blockers") as string || undefined,
      risks: formData.get("risks") as string || undefined,
      decisions: formData.get("decisions") as string || undefined,
      completionPct: Number(formData.get("completionPct")),
      confidenceLevel: formData.get("confidenceLevel") as string,
      needsAttention: formData.get("needsAttention") === "on",
    };

    try {
      const res = await fetch(`/api/rocks/${rockId}/updates`, {
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
    <div>
      <PageHeader
        title="Submit Weekly Update"
        description="This update will be appended to the rock's log and cannot be edited."
      />

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5">
        {error && (
          <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Week Of (Monday)
            </label>
            <input
              name="weekOf"
              type="date"
              defaultValue={defaultWeekOf}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Completion %
            </label>
            <input
              name="completionPct"
              type="number"
              min="0"
              max="100"
              defaultValue="0"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Progress Notes
          </label>
          <textarea
            name="progressNotes"
            className="input-field min-h-[100px]"
            placeholder="What was accomplished this week?"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Blockers
          </label>
          <textarea
            name="blockers"
            className="input-field min-h-[60px]"
            placeholder="Any blockers preventing progress?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Risks
          </label>
          <textarea
            name="risks"
            className="input-field min-h-[60px]"
            placeholder="Emerging risks or concerns?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Decisions Needed
          </label>
          <textarea
            name="decisions"
            className="input-field min-h-[60px]"
            placeholder="Decisions required from leadership?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Confidence Level
            </label>
            <select
              name="confidenceLevel"
              defaultValue="HIGH"
              className="input-field"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="needsAttention"
                type="checkbox"
                className="h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent"
              />
              <span className="text-sm text-text-secondary">
                Needs leadership attention
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Submitting..." : "Submit Update"}
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
    </div>
  );
}
