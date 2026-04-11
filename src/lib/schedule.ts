import type { Department } from "@prisma/client";
import { DEPARTMENT_CONFIG } from "./constants";

export type ScheduleItemType = "GOAL" | "ROCK" | "ASSIGNMENT";

export interface ScheduleItem {
  id: string;
  entityType: ScheduleItemType;
  title: string;
  description?: string | null;
  department: Department;
  ownerName: string;
  status: string;
  priority?: string | null;
  quarter?: string | null;
  goalTitle?: string | null;
  rockTitle?: string | null;
  href: string;
  anchorDateKey?: string;
  startDateKey?: string;
  endDateKey?: string;
}

export const DEPARTMENT_SLUGS: Record<Department, string> = {
  SEC_OPS: "sec-ops",
  SAE: "sae",
  GRC: "grc",
};

const DEPARTMENT_SLUG_LOOKUP: Record<string, Department> = {
  "sec-ops": "SEC_OPS",
  sae: "SAE",
  grc: "GRC",
};

export function getDepartmentFromSlug(slug: string): Department | null {
  return DEPARTMENT_SLUG_LOOKUP[slug] ?? null;
}

export function getDepartmentHref(department: Department): string {
  return `/teams/${DEPARTMENT_SLUGS[department]}`;
}

export function getDepartmentScheduleTitle(department: Department): string {
  return `${DEPARTMENT_CONFIG[department].label} Team Schedule`;
}

export function parseScheduleYear(value?: string): number {
  const currentYear = new Date().getFullYear();
  if (!value) return currentYear;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    return currentYear;
  }

  return parsed;
}

export function getQuarterStartMonth(quarter: string): number {
  switch (quarter) {
    case "Q1":
      return 0;
    case "Q2":
      return 3;
    case "Q3":
      return 6;
    case "Q4":
      return 9;
    default:
      return 0;
  }
}

export function buildDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyFromValue(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return value.toISOString().slice(0, 10);
}

export function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}
