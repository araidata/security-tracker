"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface GoalStats {
  onTrack: number;
  atRisk: number;
  offTrack: number;
  completed: number;
}

interface DepartmentSummary {
  department: string;
  goalCount: number;
  goalAvgCompletion: number;
  rockCount: number;
  rockAvgCompletion: number;
}

const DEPT_LABELS: Record<string, string> = {
  SEC_OPS: "SecOps",
  SAE: "SAE",
  GRC: "GRC",
};

const tooltipStyle = {
  backgroundColor: "#0D1521",
  border: "1px solid #2A3B57",
  borderRadius: "16px",
  color: "#F3F7FB",
};

export function GoalStatusChart({ stats }: { stats: GoalStats }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "On Track", value: stats.onTrack, color: CHART_COLORS.green },
    { name: "At Risk", value: stats.atRisk, color: CHART_COLORS.amber },
    { name: "Off Track", value: stats.offTrack, color: CHART_COLORS.red },
    { name: "Completed", value: stats.completed, color: CHART_COLORS.blue },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Strategic Health</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">Goal status spread</h3>
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-secondary">
          {total} goals
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-text-tertiary">
          No goal data available
        </div>
      ) : !mounted ? (
        <div className="mt-6 grid gap-3">
          {data.map((entry) => (
            <div key={entry.name} className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{entry.name}</span>
                <span className="text-sm text-text-secondary">{entry.value}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-background-quaternary/80">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${total > 0 ? (entry.value / total) * 100 : 0}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-center">
          <div className="h-56 min-w-0 w-full xl:w-[52%]">
            <ResponsiveContainer width="100%" height="100%" minWidth={240}>
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={68} outerRadius={92} paddingAngle={4}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {data.map((entry) => (
              <div
                key={entry.name}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-text-primary">{entry.name}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{entry.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DepartmentChart({ data }: { data: DepartmentSummary[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map((item) => ({
    name: DEPT_LABELS[item.department] || item.department,
    Goals: item.goalAvgCompletion,
    Rocks: item.rockAvgCompletion,
  }));

  return (
    <div className="card h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Execution Coverage</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">Completion by department</h3>
        </div>
      </div>
      {mounted ? (
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={240}>
            <BarChart data={chartData} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2940" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#A7B6C8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#718197", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Goals" fill={CHART_COLORS.blue} radius={[8, 8, 0, 0]} />
              <Bar dataKey="Rocks" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {chartData.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{item.name}</span>
                <span className="text-sm text-text-secondary">Goals {item.Goals}% · Rocks {item.Rocks}%</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-background-quaternary/80">
                  <div className="h-2 rounded-full" style={{ width: `${item.Goals}%`, backgroundColor: CHART_COLORS.blue }} />
                </div>
                <div className="h-2 rounded-full bg-background-quaternary/80">
                  <div className="h-2 rounded-full" style={{ width: `${item.Rocks}%`, backgroundColor: CHART_COLORS.green }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-text-tertiary">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.blue }} />
          Goals
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.green }} />
          Rocks
        </span>
      </div>
    </div>
  );
}
