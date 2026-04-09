"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GoalFormProps {
  goal?: {
    id: string;
    title: string;
    description: string;
    fiscalYear: number;
    department: string;
    priority: string;
    targetDate: string;
    metrics: string | null;
    ownerId: string;
    status?: string;
  };
  users: { id: string; name: string; department: string }[];
}

export function GoalForm({ goal, users }: GoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      fiscalYear: Number(formData.get("fiscalYear")),
      department: formData.get("department") as string,
      priority: formData.get("priority") as string,
      targetDate: formData.get("targetDate") as string,
      metrics: (formData.get("metrics") as string) || undefined,
      ownerId: formData.get("ownerId") as string,
      ...(goal ? { status: formData.get("status") as string } : {}),
    };

    try {
      const res = await fetch(
        goal ? `/api/goals/${goal.id}` : "/api/goals",
        {
          method: goal ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ? JSON.stringify(err.error) : "Failed to save");
      }

      router.push("/goals");
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
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Title
        </label>
        <input
          name="title"
          defaultValue={goal?.title}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={goal?.description}
          className="input-field min-h-[100px]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Fiscal Year
          </label>
          <input
            name="fiscalYear"
            type="number"
            defaultValue={goal?.fiscalYear || new Date().getFullYear()}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Target Date
          </label>
          <input
            name="targetDate"
            type="date"
            defaultValue={
              goal?.targetDate
                ? new Date(goal.targetDate).toISOString().split("T")[0]
                : ""
            }
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Department
          </label>
          <select
            name="department"
            defaultValue={goal?.department || "SEC_OPS"}
            className="input-field"
          >
            <option value="SEC_OPS">SecOps</option>
            <option value="SAE">SAE</option>
            <option value="GRC">GRC</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Priority
          </label>
          <select
            name="priority"
            defaultValue={goal?.priority || "MEDIUM"}
            className="input-field"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {goal && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Status
          </label>
          <select
            name="status"
            defaultValue={goal.status || "ON_TRACK"}
            className="input-field"
          >
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="OFF_TRACK">Off Track</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Owner
        </label>
        <select
          name="ownerId"
          defaultValue={goal?.ownerId}
          className="input-field"
          required
        >
          <option value="">Select an owner</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Success Metrics
        </label>
        <textarea
          name="metrics"
          defaultValue={goal?.metrics || ""}
          className="input-field min-h-[80px]"
          placeholder="How will success be measured?"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
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
