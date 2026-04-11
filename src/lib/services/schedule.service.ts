import type { Department } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildDateKey,
  dateKeyFromValue,
  getQuarterStartMonth,
  type ScheduleItem,
} from "@/lib/schedule";

export interface ScheduleDataset {
  fiscalYear: number;
  scheduledItems: ScheduleItem[];
  unscheduledAssignments: ScheduleItem[];
}

function sortItems(items: ScheduleItem[]) {
  const itemTypeOrder = {
    GOAL: 0,
    ROCK: 1,
    ASSIGNMENT: 2,
  } as const;

  return items.sort((a, b) => {
    const dateDelta = (a.anchorDateKey ?? "").localeCompare(b.anchorDateKey ?? "");
    if (dateDelta !== 0) return dateDelta;

    const typeDelta = itemTypeOrder[a.entityType] - itemTypeOrder[b.entityType];
    if (typeDelta !== 0) return typeDelta;

    return a.title.localeCompare(b.title);
  });
}

export const scheduleService = {
  async getSchedule(filters: { fiscalYear: number; department?: Department }): Promise<ScheduleDataset> {
    const [goals, rocks, assignments] = await Promise.all([
      prisma.annualGoal.findMany({
        where: {
          fiscalYear: filters.fiscalYear,
          ...(filters.department && { department: filters.department }),
        },
        include: {
          owner: { select: { name: true } },
        },
        orderBy: [{ targetDate: "asc" }, { priority: "desc" }],
      }),
      prisma.quarterlyRock.findMany({
        where: {
          fiscalYear: filters.fiscalYear,
          ...(filters.department && { department: filters.department }),
        },
        include: {
          owner: { select: { name: true } },
          goal: { select: { title: true } },
        },
        orderBy: [{ targetDate: "asc" }, { priority: "desc" }],
      }),
      prisma.teamAssignment.findMany({
        where: {
          rock: {
            fiscalYear: filters.fiscalYear,
            ...(filters.department && { department: filters.department }),
          },
        },
        include: {
          owner: { select: { name: true } },
          rock: {
            select: {
              id: true,
              title: true,
              department: true,
              goal: { select: { title: true } },
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const scheduledItems: ScheduleItem[] = [
      ...goals.map((goal) => ({
        id: goal.id,
        entityType: "GOAL" as const,
        title: goal.title,
        description: goal.description,
        department: goal.department,
        ownerName: goal.owner.name,
        status: goal.status,
        priority: goal.priority,
        href: `/goals/${goal.id}`,
        anchorDateKey: dateKeyFromValue(goal.targetDate),
        startDateKey: buildDateKey(goal.fiscalYear, 0, 1),
        endDateKey: dateKeyFromValue(goal.targetDate),
      })),
      ...rocks.map((rock) => ({
        id: rock.id,
        entityType: "ROCK" as const,
        title: rock.title,
        description: rock.description,
        department: rock.department,
        ownerName: rock.owner.name,
        status: rock.status,
        priority: rock.priority,
        quarter: rock.quarter,
        goalTitle: rock.goal.title,
        href: `/rocks/${rock.id}`,
        anchorDateKey: dateKeyFromValue(rock.targetDate),
        startDateKey: buildDateKey(rock.fiscalYear, getQuarterStartMonth(rock.quarter), 1),
        endDateKey: dateKeyFromValue(rock.targetDate),
      })),
      ...assignments
        .filter((assignment) => assignment.dueDate)
        .map((assignment) => ({
          id: assignment.id,
          entityType: "ASSIGNMENT" as const,
          title: assignment.title,
          description: assignment.description,
          department: assignment.rock.department,
          ownerName: assignment.owner.name,
          status: assignment.status,
          rockTitle: assignment.rock.title,
          goalTitle: assignment.rock.goal.title,
          href: `/rocks/${assignment.rock.id}`,
          anchorDateKey: dateKeyFromValue(assignment.dueDate as Date),
          startDateKey: dateKeyFromValue(assignment.dueDate as Date),
          endDateKey: dateKeyFromValue(assignment.dueDate as Date),
        })),
    ];

    const unscheduledAssignments: ScheduleItem[] = assignments
      .filter((assignment) => !assignment.dueDate)
      .map((assignment) => ({
        id: assignment.id,
        entityType: "ASSIGNMENT" as const,
        title: assignment.title,
        description: assignment.description,
        department: assignment.rock.department,
        ownerName: assignment.owner.name,
        status: assignment.status,
        rockTitle: assignment.rock.title,
        goalTitle: assignment.rock.goal.title,
        href: `/rocks/${assignment.rock.id}`,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      fiscalYear: filters.fiscalYear,
      scheduledItems: sortItems(scheduledItems),
      unscheduledAssignments,
    };
  },
};
