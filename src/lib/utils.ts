import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export interface KpiItem {
  text: string;
  completed: boolean;
}

export function parseKpiItems(raw: string | null | undefined): KpiItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // Legacy: plain string — treat as single incomplete item
    return [{ text: raw, completed: false }];
  } catch {
    return raw.trim() ? [{ text: raw, completed: false }] : [];
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getQuarterFromDate(date: Date = new Date()): string {
  const month = date.getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

export function getFiscalYear(date: Date = new Date()): number {
  return date.getFullYear();
}

export function getDaysAgo(date: Date | string): number {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
