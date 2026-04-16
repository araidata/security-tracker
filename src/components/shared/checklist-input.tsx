"use client";

import { useState, useRef } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { parseKpiItems } from "@/lib/utils";
import type { KpiItem } from "@/lib/utils";

interface ChecklistInputProps {
  value: string;
  label?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
}

export function ChecklistInput({ value, onChange, onSave }: ChecklistInputProps) {
  const [items, setItems] = useState<KpiItem[]>(() => parseKpiItems(value));
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function serialize(next: KpiItem[]): string {
    return JSON.stringify(next);
  }

  function commit(next: KpiItem[]) {
    setItems(next);
    onChange?.(serialize(next));
  }

  function addItemAfter(idx: number) {
    const next = [
      ...items.slice(0, idx + 1),
      { text: "", completed: false },
      ...items.slice(idx + 1),
    ];
    commit(next);
    setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
  }

  function removeItem(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    commit(next);
    setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 0);
  }

  function toggleItem(idx: number) {
    commit(items.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item)));
  }

  function updateText(idx: number, text: string) {
    const next = items.map((item, i) => (i === idx ? { ...item, text } : item));
    setItems(next);
    onChange?.(serialize(next));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItemAfter(idx);
    }
    if (e.key === "Backspace" && items[idx].text === "" && items.length > 1) {
      e.preventDefault();
      removeItem(idx);
    }
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(serialize(items));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-0.5">
      {items.length === 0 && (
        <p className="py-1.5 text-xs italic text-text-tertiary">No items yet.</p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className="group flex items-center gap-2 py-1.5">
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
            onKeyDown={(e) => handleKeyDown(e, idx)}
            placeholder="Item..."
            className={`h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary ${
              item.completed ? "text-emerald-500" : "text-text-primary"
            }`}
          />
          <button
            type="button"
            onClick={() => removeItem(idx)}
            tabIndex={-1}
            className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary opacity-0 transition-opacity hover:text-status-off-track group-hover:opacity-100"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => addItemAfter(items.length - 1)}
          className="flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-accent"
        >
          <PlusIcon className="h-3 w-3" />
          Add item
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary h-6 px-2 py-0 text-xs disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
