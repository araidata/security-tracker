"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface QuarterlyReviewDialogProps {
  goalId?: string;
}

export function QuarterlyReviewDialog({ goalId }: QuarterlyReviewDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState(goalId ?? "");

  useEffect(() => {
    if (open) {
      fetch("/api/goals")
        .then((r) => r.json())
        .then((data) => setGoals(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open]);

  // Sync if goalId prop changes while open
  useEffect(() => {
    setSelectedGoalId(goalId ?? "");
  }, [goalId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      goalId: selectedGoalId || formData.get("goalId"),
      quarter: formData.get("quarter"),
      fiscalYear: Number(formData.get("fiscalYear")),
      plannedOutcomes: formData.get("plannedOutcomes"),
      actualOutcomes: formData.get("actualOutcomes"),
      lessonsLearned: formData.get("lessonsLearned") || undefined,
      adjustments: formData.get("adjustments") || undefined,
      overallStatus: formData.get("overallStatus"),
    };

    try {
      const res = await fetch("/api/reviews/quarterly", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Create Quarterly Review</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-text-tertiary hover:text-text-primary"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="rounded-lg bg-status-off-track/10 p-2.5 text-sm text-status-off-track">
              {error}
            </div>
          )}

          {/* Top row: Goal | Quarter | Fiscal Year | Status */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Goal
              </label>
              {goalId ? (
                <>
                  <input type="hidden" name="goalId" value={selectedGoalId} />
                  <div className="input-field truncate text-sm text-text-primary opacity-70">
                    {goals.find((g) => g.id === goalId)?.title ?? "Loading…"}
                  </div>
                </>
              ) : (
                <select
                  name="goalId"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Quarter
              </label>
              <select name="quarter" defaultValue="Q1" className="input-field">
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Fiscal Year
              </label>
              <input
                name="fiscalYear"
                type="number"
                defaultValue={new Date().getFullYear()}
                className="input-field"
              />
            </div>
          </div>

          {/* Status row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Overall Status
              </label>
              <select name="overallStatus" defaultValue="ON_TRACK" className="input-field">
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OFF_TRACK">Off Track</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* 2-column body: Left = Planned + Lessons, Right = Actual + Adjustments */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Planned Outcomes <span className="text-status-off-track">*</span>
                </label>
                <textarea
                  name="plannedOutcomes"
                  className="input-field min-h-[80px] resize-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Lessons Learned
                </label>
                <textarea
                  name="lessonsLearned"
                  className="input-field min-h-[64px] resize-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Actual Outcomes <span className="text-status-off-track">*</span>
                </label>
                <textarea
                  name="actualOutcomes"
                  className="input-field min-h-[80px] resize-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Adjustments / Carry-Forward
                </label>
                <textarea
                  name="adjustments"
                  className="input-field min-h-[64px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating…" : "Create Review"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
