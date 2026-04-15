"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function MonthlyReviewDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/goals")
        .then((r) => r.json())
        .then((data) => setGoals(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      goalId: formData.get("goalId"),
      month: Number(formData.get("month")),
      fiscalYear: Number(formData.get("fiscalYear")),
      summary: formData.get("summary"),
      highlights: formData.get("highlights") || undefined,
      concerns: formData.get("concerns") || undefined,
      leadershipNotes: formData.get("leadershipNotes") || undefined,
      overallStatus: formData.get("overallStatus"),
    };

    try {
      const res = await fetch("/api/reviews/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create review");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <PlusIcon className="mr-1 h-3.5 w-3.5" />
        New Review
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Create Monthly Review
            </h3>
            <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {error && (
              <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Goal</label>
              <select name="goalId" className="input-field" required>
                <option value="">Select goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Month</label>
                <select name="month" defaultValue={new Date().getMonth() + 1} className="input-field">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString("en", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Fiscal Year</label>
                <input name="fiscalYear" type="number" defaultValue={new Date().getFullYear()} className="input-field" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Overall Status</label>
              <select name="overallStatus" defaultValue="ON_TRACK" className="input-field">
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OFF_TRACK">Off Track</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Summary</label>
              <textarea name="summary" className="input-field min-h-[56px]" required />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Highlights</label>
              <textarea name="highlights" className="input-field min-h-[44px]" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Concerns</label>
              <textarea name="concerns" className="input-field min-h-[44px]" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Leadership Notes</label>
              <textarea name="leadershipNotes" className="input-field min-h-[44px]" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Creating..." : "Create Review"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
