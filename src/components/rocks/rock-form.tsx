"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RockFormProps {
  rock?: {
    id: string;
    title: string;
    description: string;
    quarter: string;
    fiscalYear: number;
    priority: string;
    targetDate: string;
    kpiMetric: string | null;
    department: string;
    goalId: string;
    ownerId: string;
    status?: string;
    confidence?: string;
    completionPct?: number;
    blockers?: string | null;
  };
  goals: { id: string; title: string }[];
  users: { id: string; name: string; department: string }[];
  defaultGoalId?: string;
}

export function RockForm({ rock, goals, users, defaultGoalId }: RockFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      title: formData.get("title"),
      description: formData.get("description"),
      quarter: formData.get("quarter"),
      fiscalYear: Number(formData.get("fiscalYear")),
      priority: formData.get("priority"),
      targetDate: formData.get("targetDate"),
      kpiMetric: formData.get("kpiMetric") || undefined,
      department: formData.get("department"),
      goalId: formData.get("goalId"),
      ownerId: formData.get("ownerId"),
    };

    if (rock) {
      data.status = formData.get("status");
      data.confidence = formData.get("confidence");
      data.completionPct = Number(formData.get("completionPct"));
      data.blockers = formData.get("blockers") || undefined;
    }

    try {
      const res = await fetch(
        rock ? `/api/rocks/${rock.id}` : "/api/rocks",
        {
          method: rock ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ? JSON.stringify(err.error) : "Failed to save");
      }

      router.push("/rocks");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-3">
      {error && (
        <div className="rounded-lg bg-status-off-track/10 p-3 text-sm text-status-off-track">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Title</label>
        <input name="title" defaultValue={rock?.title} className="input-field" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Description</label>
        <textarea name="description" defaultValue={rock?.description} className="input-field min-h-[100px]" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Linked Goal</label>
        <select name="goalId" defaultValue={rock?.goalId || defaultGoalId} className="input-field" required>
          <option value="">Select a goal</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Quarter</label>
          <select name="quarter" defaultValue={rock?.quarter || "Q2"} className="input-field">
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Fiscal Year</label>
          <input name="fiscalYear" type="number" defaultValue={rock?.fiscalYear || new Date().getFullYear()} className="input-field" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Target Date</label>
          <input name="targetDate" type="date" defaultValue={rock?.targetDate ? new Date(rock.targetDate).toISOString().split("T")[0] : ""} className="input-field" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Department</label>
          <select name="department" defaultValue={rock?.department || "SEC_OPS"} className="input-field">
            <option value="SEC_OPS">SecOps</option>
            <option value="SAE">SAE</option>
            <option value="GRC">GRC</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Priority</label>
          <select name="priority" defaultValue={rock?.priority || "MEDIUM"} className="input-field">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Owner</label>
        <select name="ownerId" defaultValue={rock?.ownerId} className="input-field" required>
          <option value="">Select an owner</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">KPI Metric</label>
        <input name="kpiMetric" defaultValue={rock?.kpiMetric || ""} className="input-field" placeholder="e.g., MTTR < 72 hours" />
      </div>

      {rock && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Status</label>
              <select name="status" defaultValue={rock.status} className="input-field">
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Confidence</label>
              <select name="confidence" defaultValue={rock.confidence} className="input-field">
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Completion %</label>
              <input name="completionPct" type="number" min="0" max="100" defaultValue={rock.completionPct || 0} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Blockers</label>
            <textarea name="blockers" defaultValue={rock.blockers || ""} className="input-field min-h-[60px]" />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : rock ? "Update Rock" : "Create Rock"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
