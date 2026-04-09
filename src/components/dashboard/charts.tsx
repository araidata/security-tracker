"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-background-secondary p-3 shadow-lg">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-text-secondary">
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function GoalStatusChart({ stats }: { stats: GoalStats }) {
  const data = [
    { name: "On Track", value: stats.onTrack, color: CHART_COLORS.green },
    { name: "At Risk", value: stats.atRisk, color: CHART_COLORS.amber },
    { name: "Off Track", value: stats.offTrack, color: CHART_COLORS.red },
    { name: "Completed", value: stats.completed, color: CHART_COLORS.blue },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">
          Goals by Status
        </h3>
        <div className="flex h-48 items-center justify-center text-sm text-text-tertiary">
          No goal data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Goals by Status
      </h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-text-secondary">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DepartmentChart({ data }: { data: DepartmentSummary[] }) {
  const chartData = data.map((d) => ({
    name: DEPT_LABELS[d.department] || d.department,
    Goals: d.goalAvgCompletion,
    Rocks: d.rockAvgCompletion,
  }));

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Completion by Department
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A3442" />
          <XAxis dataKey="name" tick={{ fill: "#9FB0C3", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9FB0C3", fontSize: 12 }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9FB0C3" }} />
          <Bar dataKey="Goals" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rocks" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
