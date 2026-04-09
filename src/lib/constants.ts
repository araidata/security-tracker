export const STATUS_CONFIG = {
  ON_TRACK: {
    label: "On Track",
    color: "text-status-on-track",
    bg: "bg-status-on-track",
    dot: "bg-status-on-track",
  },
  AT_RISK: {
    label: "At Risk",
    color: "text-status-at-risk",
    bg: "bg-status-at-risk",
    dot: "bg-status-at-risk",
  },
  OFF_TRACK: {
    label: "Off Track",
    color: "text-status-off-track",
    bg: "bg-status-off-track",
    dot: "bg-status-off-track",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-status-complete",
    bg: "bg-status-complete",
    dot: "bg-status-complete",
  },
} as const;

export const ROCK_STATUS_CONFIG = {
  NOT_STARTED: {
    label: "Not Started",
    color: "text-status-not-started",
    bg: "bg-gray-500/10",
    dot: "bg-status-not-started",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-status-on-track",
    bg: "bg-status-on-track",
    dot: "bg-status-on-track",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-status-blocked",
    bg: "bg-status-blocked",
    dot: "bg-status-blocked",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-status-complete",
    bg: "bg-status-complete",
    dot: "bg-status-complete",
  },
  OVERDUE: {
    label: "Overdue",
    color: "text-status-off-track",
    bg: "bg-status-off-track",
    dot: "bg-status-off-track",
  },
} as const;

export const TASK_STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    color: "text-status-not-started",
    bg: "bg-gray-500/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-status-on-track",
    bg: "bg-status-on-track",
  },
  DONE: {
    label: "Done",
    color: "text-status-complete",
    bg: "bg-status-complete",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-status-blocked",
    bg: "bg-status-blocked",
  },
} as const;

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "text-text-tertiary", bg: "bg-gray-500/10" },
  MEDIUM: { label: "Medium", color: "text-accent", bg: "bg-accent/10" },
  HIGH: { label: "High", color: "text-status-at-risk", bg: "bg-status-at-risk" },
  CRITICAL: { label: "Critical", color: "text-status-off-track", bg: "bg-status-off-track" },
} as const;

export const CONFIDENCE_CONFIG = {
  HIGH: { label: "High", color: "text-status-on-track", icon: "check-circle" },
  MEDIUM: { label: "Medium", color: "text-status-at-risk", icon: "exclamation-triangle" },
  LOW: { label: "Low", color: "text-low-confidence", icon: "x-circle" },
} as const;

export const DEPARTMENT_CONFIG = {
  SEC_OPS: { label: "SecOps", shortLabel: "SO" },
  SAE: { label: "SAE", shortLabel: "SAE" },
  GRC: { label: "GRC", shortLabel: "GRC" },
} as const;

export const DEPARTMENT_ORDER = ["SEC_OPS", "SAE", "GRC"] as const;

export const ROLE_CONFIG = {
  EXECUTIVE: { label: "Executive" },
  MANAGER: { label: "Manager" },
  CONTRIBUTOR: { label: "Contributor" },
} as const;

export const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"] as const;

export const CHART_COLORS = {
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  orange: "#F97316",
  purple: "#8B5CF6",
  gray: "#6B7280",
} as const;
