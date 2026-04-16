"use client";

import { useState, useRef, useCallback } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface KpiItem {
  text: string;
  completed: boolean;
}

interface KpiChecklistProps {
  rockId: string;
  initialItems: KpiItem[];
}

export function parseKpiItems(raw: string | null | undefined): KpiItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [{ text: raw, completed: false }];
  } catch {
    return raw.trim() ? [{ text: raw, completed: false }] : [];
  }
}

export function KpiChecklist({ rockId, initialItems }: KpiChecklistProps) {
  const [items, setItems] = useState<KpiItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const persist = useCallback(
    async (next: KpiItem[]) => {
      setSaving(true);
      try {
        await fetch(`/api/rocks/${rockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kpiMetric: JSON.stringify(next) }),
        });
      } finally {
        setSaving(false);
      }
    },
    [rockId],
  );

  function addItemAfter(idx: number) {
    setItems((prev) => {
      const next = [
        ...prev.slice(0, idx + 1),
        { text: "", completed: false },
        ...prev.slice(idx + 1),
      ];
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
      return next;
    });
  }

  function removeItem(idx: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      persist(next);
      setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 0);
      return next;
    });
  }

  function toggleItem(idx: number) {
    setItems((prev) => {
      const next = prev.map((item, i) =>
        i === idx ? { ...item, completed: !item.completed } : item,
      );
      persist(next);
      return next;
    });
  }

  function updateText(idx: number, text: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, text } : item)));
  }

  function handleBlur(current: KpiItem[]) {
    persist(current);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number, current: KpiItem[]) {
    if (e.key === "Enter") {
      e.preventDefault();
      persist(current);
      addItemAfter(idx);
    }
    if (e.key === "Backspace" && current[idx].text === "" && current.length > 1) {
      e.preventDefault();
      removeItem(idx);
    }
  }

  return (
    <div className="space-y-1">
      {items.length === 0 && (
        <p className="text-xs text-text-tertiary italic">No KPI items. Add one below.</p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className="group flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => toggleItem(idx)}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border accent-accent"
          />
          <input
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            value={item.text}
            onChange={(e) => updateText(idx, e.target.value)}
            onBlur={() => handleBlur(items)}
            onKeyDown={(e) => handleKeyDown(e, idx, items)}
            placeholder="KPI item..."
            className={`flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary focus:outline-none ${
              item.completed ? "text-text-tertiary line-through" : "text-text-primary"
            }`}
          />
          <button
            type="button"
            onClick={() => removeItem(idx)}
            tabIndex={-1}
            className="h-5 w-5 flex items-center justify-center rounded text-text-tertiary opacity-0 transition-opacity hover:text-status-off-track group-hover:opacity-100"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => addItemAfter(items.length - 1)}
          className="flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-accent"
        >
          <PlusIcon className="h-3 w-3" />
          Add item
        </button>
        {saving && <span className="text-[10px] text-text-tertiary">Saving…</span>}
      </div>
    </div>
  );
}
