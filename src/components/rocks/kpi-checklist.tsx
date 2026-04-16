"use client";

import { ChecklistInput } from "@/components/shared/checklist-input";
import type { KpiItem } from "@/lib/utils";

interface KpiChecklistProps {
  rockId: string;
  initialItems: KpiItem[];
}

export function KpiChecklist({ rockId, initialItems }: KpiChecklistProps) {
  async function handleSave(value: string) {
    await fetch(`/api/rocks/${rockId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kpiMetric: value }),
    });
  }

  return (
    <ChecklistInput
      value={JSON.stringify(initialItems)}
      onSave={handleSave}
    />
  );
}
