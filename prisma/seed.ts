import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

const rootDir = process.cwd();
const loadedFromFiles = new Set<string>();

for (const envFile of [".env", ".env.local"]) {
  const envPath = path.join(rootDir, envFile);

  if (!fs.existsSync(envPath)) {
    continue;
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined || loadedFromFiles.has(key)) {
      process.env[key] = value;
      loadedFromFiles.add(key);
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("SecTrack2026!", 12);

  // ──── Users ────
  const users = await Promise.all([
    // SecOps
    prisma.user.upsert({
      where: { email: "sarah.chen@secops.gov" },
      update: {},
      create: {
        email: "sarah.chen@secops.gov",
        name: "Sarah Chen",
        passwordHash,
        role: "EXECUTIVE",
        department: "SEC_OPS",
      },
    }),
    prisma.user.upsert({
      where: { email: "james.rivera@secops.gov" },
      update: {},
      create: {
        email: "james.rivera@secops.gov",
        name: "James Rivera",
        passwordHash,
        role: "MANAGER",
        department: "SEC_OPS",
      },
    }),
    prisma.user.upsert({
      where: { email: "maria.thompson@secops.gov" },
      update: {},
      create: {
        email: "maria.thompson@secops.gov",
        name: "Maria Thompson",
        passwordHash,
        role: "CONTRIBUTOR",
        department: "SEC_OPS",
      },
    }),
    // SAE
    prisma.user.upsert({
      where: { email: "david.park@sae.gov" },
      update: {},
      create: {
        email: "david.park@sae.gov",
        name: "David Park",
        passwordHash,
        role: "EXECUTIVE",
        department: "SAE",
      },
    }),
    prisma.user.upsert({
      where: { email: "lisa.nguyen@sae.gov" },
      update: {},
      create: {
        email: "lisa.nguyen@sae.gov",
        name: "Lisa Nguyen",
        passwordHash,
        role: "MANAGER",
        department: "SAE",
      },
    }),
    prisma.user.upsert({
      where: { email: "carlos.mendez@sae.gov" },
      update: {},
      create: {
        email: "carlos.mendez@sae.gov",
        name: "Carlos Mendez",
        passwordHash,
        role: "CONTRIBUTOR",
        department: "SAE",
      },
    }),
    // GRC
    prisma.user.upsert({
      where: { email: "rachel.foster@grc.gov" },
      update: {},
      create: {
        email: "rachel.foster@grc.gov",
        name: "Rachel Foster",
        passwordHash,
        role: "EXECUTIVE",
        department: "GRC",
      },
    }),
    prisma.user.upsert({
      where: { email: "kevin.wright@grc.gov" },
      update: {},
      create: {
        email: "kevin.wright@grc.gov",
        name: "Kevin Wright",
        passwordHash,
        role: "MANAGER",
        department: "GRC",
      },
    }),
    prisma.user.upsert({
      where: { email: "amanda.jones@grc.gov" },
      update: {},
      create: {
        email: "amanda.jones@grc.gov",
        name: "Amanda Jones",
        passwordHash,
        role: "CONTRIBUTOR",
        department: "GRC",
      },
    }),
  ]);

  const [sarahChen, jamesRivera, mariaThompson, davidPark, lisaNguyen, carlosMendez, rachelFoster, kevinWright, amandaJones] = users;

  // ──── Annual Goals ────
  const goals = await Promise.all([
    // SecOps Goals
    prisma.annualGoal.create({
      data: {
        title: "Achieve 99.9% SOC Uptime Across All Monitored Environments",
        description:
          "Ensure the Security Operations Center maintains near-perfect uptime for all SIEM, EDR, and monitoring tools across on-premise and cloud environments. This includes implementing redundant infrastructure, automated failover, and 24/7 operational readiness.",
        fiscalYear: 2026,
        department: "SEC_OPS",
        status: "ON_TRACK",
        priority: "CRITICAL",
        targetDate: new Date("2026-12-31"),
        completionPct: 62,
        metrics: "SOC uptime >= 99.9%; MTTR for tool outages < 15 min; Zero missed alerts due to infrastructure failures",
        ownerId: sarahChen.id,
        createdBy: sarahChen.id,
      },
    }),
    prisma.annualGoal.create({
      data: {
        title: "Implement Automated Threat Hunting Capability",
        description:
          "Build and deploy automated threat hunting playbooks that proactively search for indicators of compromise across the enterprise. Leverage MITRE ATT&CK framework for coverage mapping and integrate with existing SOAR platform.",
        fiscalYear: 2026,
        department: "SEC_OPS",
        status: "AT_RISK",
        priority: "HIGH",
        targetDate: new Date("2026-12-31"),
        completionPct: 35,
        metrics: "12 automated hunting playbooks deployed; 90% ATT&CK technique coverage; 25% reduction in dwell time",
        ownerId: jamesRivera.id,
        createdBy: sarahChen.id,
      },
    }),
    // SAE Goals
    prisma.annualGoal.create({
      data: {
        title: "Complete FedRAMP High Authorization for 3 Cloud Services",
        description:
          "Achieve FedRAMP High authorization for three critical cloud services currently operating under provisional ATOs. This requires completing security assessments, remediating findings, and obtaining 3PAO attestation.",
        fiscalYear: 2026,
        department: "SAE",
        status: "ON_TRACK",
        priority: "CRITICAL",
        targetDate: new Date("2026-12-31"),
        completionPct: 55,
        metrics: "3 FedRAMP High ATOs granted; 0 critical findings unresolved; All POA&Ms on schedule",
        ownerId: davidPark.id,
        createdBy: davidPark.id,
      },
    }),
    prisma.annualGoal.create({
      data: {
        title: "Reduce MTTR for Critical Vulnerabilities to < 72 Hours",
        description:
          "Improve the organization's vulnerability management posture by reducing the mean time to remediate critical vulnerabilities from the current 14-day average to under 72 hours. Requires process automation, improved scanning coverage, and accountability structures.",
        fiscalYear: 2026,
        department: "SAE",
        status: "AT_RISK",
        priority: "HIGH",
        targetDate: new Date("2026-12-31"),
        completionPct: 40,
        metrics: "MTTR Critical < 72hrs; MTTR High < 7 days; Scan coverage >= 98%; Zero critical vulns > 30 days",
        ownerId: lisaNguyen.id,
        createdBy: davidPark.id,
      },
    }),
    // GRC Goals
    prisma.annualGoal.create({
      data: {
        title: "Achieve CMMC Level 2 Certification",
        description:
          "Complete all requirements for CMMC Level 2 certification across all systems handling Controlled Unclassified Information (CUI). Includes gap assessment, remediation of findings, and successful C3PAO assessment.",
        fiscalYear: 2026,
        department: "GRC",
        status: "ON_TRACK",
        priority: "CRITICAL",
        targetDate: new Date("2026-09-30"),
        completionPct: 70,
        metrics: "CMMC Level 2 certification achieved; All 110 NIST 800-171 controls implemented; Zero unfixed POA&M items at assessment",
        ownerId: rachelFoster.id,
        createdBy: rachelFoster.id,
      },
    }),
    prisma.annualGoal.create({
      data: {
        title: "Establish Continuous Compliance Monitoring for CJIS",
        description:
          "Deploy and operationalize a continuous compliance monitoring program aligned with CJIS Security Policy requirements. Integrate with GRC platform for automated evidence collection, gap detection, and reporting.",
        fiscalYear: 2026,
        department: "GRC",
        status: "ON_TRACK",
        priority: "HIGH",
        targetDate: new Date("2026-12-31"),
        completionPct: 45,
        metrics: "100% CJIS controls monitored continuously; Automated evidence collection for 80% of controls; Monthly compliance score >= 95%",
        ownerId: kevinWright.id,
        createdBy: rachelFoster.id,
      },
    }),
  ]);

  const [socUptime, threatHunting, fedRamp, vulnMgmt, cmmc, cjis] = goals;

  // ──── Quarterly Rocks ────
  const rocks = await Promise.all([
    // SOC Uptime Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Deploy Redundant SIEM Collectors Across All Network Segments",
        description: "Install and configure redundant Splunk Heavy Forwarders in each network segment to eliminate single points of failure in log collection.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "CRITICAL",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "All 12 network segments have redundant collectors",
        department: "SEC_OPS",
        goalId: socUptime.id,
        ownerId: jamesRivera.id,
        createdBy: sarahChen.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Implement Automated Failover for Primary SOC Tooling",
        description: "Configure automatic failover for Splunk, CrowdStrike, and Palo Alto Cortex XSOAR to ensure continuous monitoring during infrastructure events.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "IN_PROGRESS",
        priority: "HIGH",
        confidence: "MEDIUM",
        targetDate: new Date("2026-06-30"),
        completionPct: 45,
        kpiMetric: "Failover tested successfully for all 3 platforms",
        blockers: "Waiting on ATO approval for new cloud SIEM failover instance from ISSM",
        department: "SEC_OPS",
        goalId: socUptime.id,
        ownerId: jamesRivera.id,
        createdBy: sarahChen.id,
      },
    }),
    // Threat Hunting Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Develop Initial Threat Hunting Playbook Library (6 Playbooks)",
        description: "Create 6 automated threat hunting playbooks based on top MITRE ATT&CK techniques observed in government sector threat intelligence.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "HIGH",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "6 playbooks created and peer-reviewed",
        department: "SEC_OPS",
        goalId: threatHunting.id,
        ownerId: mariaThompson.id,
        createdBy: jamesRivera.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Integrate Hunting Playbooks with SOAR Platform",
        description: "Deploy the 6 hunting playbooks into Cortex XSOAR with automated scheduling and result aggregation dashboards.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "BLOCKED",
        priority: "HIGH",
        confidence: "LOW",
        targetDate: new Date("2026-06-30"),
        completionPct: 20,
        kpiMetric: "All 6 playbooks running on automated schedule",
        blockers: "XSOAR license upgrade pending procurement approval - 3 week delay expected",
        department: "SEC_OPS",
        goalId: threatHunting.id,
        ownerId: mariaThompson.id,
        createdBy: jamesRivera.id,
      },
    }),
    // FedRAMP Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Complete Security Assessment for Cloud Service #1 (Azure Gov)",
        description: "Finalize the FedRAMP High security assessment package for Azure Government including SSP, SAR, and POA&M for 3PAO review.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "CRITICAL",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "SSP, SAR, POA&M submitted to 3PAO",
        department: "SAE",
        goalId: fedRamp.id,
        ownerId: lisaNguyen.id,
        createdBy: davidPark.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Remediate FedRAMP Findings for Cloud Service #2 (AWS GovCloud)",
        description: "Address all high and moderate findings from the initial FedRAMP assessment of AWS GovCloud environment.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        confidence: "MEDIUM",
        targetDate: new Date("2026-06-30"),
        completionPct: 55,
        kpiMetric: "All high findings remediated; 80% moderate findings remediated",
        department: "SAE",
        goalId: fedRamp.id,
        ownerId: carlosMendez.id,
        createdBy: davidPark.id,
      },
    }),
    // Vuln Management Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Deploy Automated Vulnerability Scanning Across All Endpoints",
        description: "Expand Tenable.sc scanning coverage from 85% to 98% of all managed endpoints including servers, workstations, and network devices.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "HIGH",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "Scan coverage >= 98%",
        department: "SAE",
        goalId: vulnMgmt.id,
        ownerId: lisaNguyen.id,
        createdBy: davidPark.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Implement Automated Remediation Workflows for Critical Vulns",
        description: "Build ServiceNow integration with Tenable.sc to auto-create tickets for critical findings and track SLA compliance.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "IN_PROGRESS",
        priority: "HIGH",
        confidence: "MEDIUM",
        targetDate: new Date("2026-06-30"),
        completionPct: 30,
        kpiMetric: "Auto-ticket creation < 1hr; SLA dashboard live",
        blockers: "ServiceNow API integration requires elevated access that is pending security review",
        department: "SAE",
        goalId: vulnMgmt.id,
        ownerId: carlosMendez.id,
        createdBy: lisaNguyen.id,
      },
    }),
    // CMMC Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Complete CMMC Gap Assessment for All CUI Systems",
        description: "Conduct a comprehensive gap assessment against all 110 NIST 800-171 controls for systems processing CUI.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "CRITICAL",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "All 110 controls assessed; Gap report delivered",
        department: "GRC",
        goalId: cmmc.id,
        ownerId: kevinWright.id,
        createdBy: rachelFoster.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Remediate Top 20 CMMC Control Gaps",
        description: "Address the 20 highest-priority control gaps identified in the Q1 assessment, focusing on access control and audit logging.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        confidence: "HIGH",
        targetDate: new Date("2026-06-30"),
        completionPct: 60,
        kpiMetric: "20 control gaps remediated; Evidence documented",
        department: "GRC",
        goalId: cmmc.id,
        ownerId: amandaJones.id,
        createdBy: kevinWright.id,
      },
    }),
    // CJIS Rocks
    prisma.quarterlyRock.create({
      data: {
        title: "Map CJIS Security Policy Controls to GRC Platform",
        description: "Import all CJIS Security Policy requirements into the GRC platform (OneTrust) and map to existing organizational controls.",
        quarter: "Q1",
        fiscalYear: 2026,
        status: "COMPLETED",
        priority: "HIGH",
        confidence: "HIGH",
        targetDate: new Date("2026-03-31"),
        completionPct: 100,
        kpiMetric: "All CJIS controls mapped in OneTrust",
        department: "GRC",
        goalId: cjis.id,
        ownerId: kevinWright.id,
        createdBy: rachelFoster.id,
      },
    }),
    prisma.quarterlyRock.create({
      data: {
        title: "Deploy Automated Evidence Collection for CJIS Controls",
        description: "Configure Purview and OneTrust integrations to automatically collect compliance evidence for 80% of CJIS controls.",
        quarter: "Q2",
        fiscalYear: 2026,
        status: "IN_PROGRESS",
        priority: "HIGH",
        confidence: "MEDIUM",
        targetDate: new Date("2026-06-30"),
        completionPct: 35,
        kpiMetric: "Automated evidence for 80% of controls",
        department: "GRC",
        goalId: cjis.id,
        ownerId: amandaJones.id,
        createdBy: kevinWright.id,
      },
    }),
  ]);

  // ──── Team Assignments ────
  const assignments = [];
  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    const deptUsers = users.filter(
      (u) => u.department === rock.department
    );
    const owner = deptUsers.find((u) => u.role === "MANAGER") || deptUsers[0];
    const contributor = deptUsers.find((u) => u.role === "CONTRIBUTOR") || deptUsers[1];

    const taskTitles = [
      [
        "Configure redundant Splunk forwarders in DMZ",
        "Write runbook for SIEM failover procedure",
      ],
      [
        "Set up failover testing environment",
        "Document failover SLA requirements",
      ],
      [
        "Create T1059 PowerShell hunting playbook",
        "Create T1078 credential abuse hunting playbook",
      ],
      [
        "Configure XSOAR playbook scheduling",
        "Build hunting results dashboard",
      ],
      [
        "Compile SSP documentation for Azure Gov",
        "Coordinate 3PAO assessment schedule",
      ],
      [
        "Remediate critical IAM findings in AWS",
        "Update network segmentation documentation",
      ],
      [
        "Deploy Tenable agents to remote endpoints",
        "Validate scan coverage metrics",
      ],
      [
        "Build ServiceNow-Tenable API connector",
        "Create SLA tracking dashboard",
      ],
      [
        "Assess access control practices (AC family)",
        "Document audit logging gaps (AU family)",
      ],
      [
        "Implement MFA for all CUI system access",
        "Deploy enhanced audit logging",
      ],
      [
        "Import CJIS controls into OneTrust",
        "Map existing policies to CJIS requirements",
      ],
      [
        "Configure Purview DLP for CJIS data",
        "Set up automated compliance reporting",
      ],
    ];

    const titles = taskTitles[i] || [
      `Task 1 for ${rock.title}`,
      `Task 2 for ${rock.title}`,
    ];

    for (let j = 0; j < 2; j++) {
      const isCompleted = rock.status === "COMPLETED";
      const a = await prisma.teamAssignment.create({
        data: {
          title: titles[j],
          description: `Detailed work item for: ${rock.title}`,
          status: isCompleted ? "DONE" : j === 0 ? "IN_PROGRESS" : "TODO",
          dueDate: rock.targetDate,
          rockId: rock.id,
          ownerId: j === 0 ? owner.id : contributor.id,
          createdBy: owner.id,
        },
      });

      if (contributor && j === 0) {
        await prisma.assignmentContributor.create({
          data: {
            assignmentId: a.id,
            userId: contributor.id,
          },
        });
      }

      assignments.push(a);
    }
  }

  // ──── Weekly Updates ────
  const weekDates = [
    new Date("2026-03-09"),
    new Date("2026-03-16"),
    new Date("2026-03-23"),
  ];

  for (const rock of rocks) {
    const author = users.find((u) => u.id === rock.ownerId) || users[0];

    for (let w = 0; w < weekDates.length; w++) {
      const pct =
        rock.status === "COMPLETED"
          ? [70, 90, 100][w]
          : [
              Math.round(rock.completionPct * 0.5),
              Math.round(rock.completionPct * 0.75),
              rock.completionPct,
            ][w];

      const progressNotes = [
        `Initial progress on ${rock.title}. Set up project infrastructure and assembled the team.`,
        `Continued development. Key milestones achieved this week include baseline configuration and initial testing.`,
        `Significant progress made. ${rock.status === "COMPLETED" ? "All deliverables completed and verified." : "On track for target date with minor adjustments needed."}`,
      ];

      await prisma.weeklyUpdate.create({
        data: {
          rockId: rock.id,
          authorId: author.id,
          weekOf: weekDates[w],
          progressNotes: progressNotes[w],
          blockers: rock.blockers && w === 2 ? rock.blockers : null,
          risks:
            rock.confidence === "LOW" && w >= 1
              ? "Resource constraints may impact delivery timeline"
              : null,
          decisions:
            rock.status === "BLOCKED" && w === 2
              ? "Need leadership decision on procurement priority"
              : null,
          completionPct: pct,
          confidenceLevel: rock.confidence,
          needsAttention: rock.status === "BLOCKED" || rock.confidence === "LOW",
        },
      });
    }
  }

  // ──── Monthly Reviews ────
  const monthlyGoals = [socUptime, fedRamp, cmmc];
  const months = [1, 2, 3];

  for (const goal of monthlyGoals) {
    for (const month of months) {
      const owner = users.find((u) => u.id === goal.ownerId)!;
      await prisma.monthlyReview.create({
        data: {
          goalId: goal.id,
          month,
          fiscalYear: 2026,
          summary: `${["January", "February", "March"][month - 1]} review: ${goal.title} remains ${goal.status === "ON_TRACK" ? "on track" : "at risk"}. Key activities included continued execution of linked quarterly rocks.`,
          highlights:
            month === 3
              ? "Q1 rocks completed on schedule. Strong team execution."
              : "Steady progress across all work streams.",
          concerns:
            goal.status === "AT_RISK"
              ? "Resource availability and procurement timelines remain a concern."
              : null,
          leadershipNotes:
            month === 3
              ? "Reviewed at quarterly leadership sync. Approved continuation of current approach."
              : null,
          overallStatus: goal.status,
          createdBy: owner.id,
        },
      });
    }
  }

  // ──── Quarterly Reviews ────
  const q1Goals = [socUptime, threatHunting, cmmc];
  for (const goal of q1Goals) {
    const owner = users.find((u) => u.id === goal.ownerId)!;
    const review = await prisma.quarterlyReview.create({
      data: {
        goalId: goal.id,
        quarter: "Q1",
        fiscalYear: 2026,
        plannedOutcomes: `Complete all Q1 rocks for: ${goal.title}. Establish foundation for Q2 execution.`,
        actualOutcomes: `Q1 rocks completed successfully. Infrastructure and processes established for continued progress in Q2.`,
        lessonsLearned:
          "Early procurement engagement is critical for Q2 deliverables. Team capacity planning needs improvement.",
        adjustments:
          "Accelerating procurement requests for Q2 to avoid delays. Adding buffer time to Q2 estimates.",
        overallStatus: "ON_TRACK",
        createdBy: owner.id,
      },
    });

    // Add rock snapshots
    const goalRocks = rocks.filter(
      (r) => r.goalId === goal.id && r.quarter === "Q1"
    );
    for (const rock of goalRocks) {
      await prisma.quarterlyReviewRock.create({
        data: {
          quarterlyReviewId: review.id,
          rockId: rock.id,
          plannedCompletion: 100,
          actualCompletion: rock.completionPct,
          statusAtReview: rock.status,
          notes: `${rock.title} - Completed as planned`,
        },
      });
    }
  }

  console.log("Seed data created successfully!");
  console.log(`  - ${users.length} users`);
  console.log(`  - ${goals.length} annual goals`);
  console.log(`  - ${rocks.length} quarterly rocks`);
  console.log(`  - ${assignments.length} team assignments`);
  console.log(`  - ${rocks.length * 3} weekly updates`);
  console.log(`  - ${monthlyGoals.length * 3} monthly reviews`);
  console.log(`  - ${q1Goals.length} quarterly reviews`);
  console.log("\nLogin credentials:");
  console.log("  Executive: sarah.chen@secops.gov / SecTrack2026!");
  console.log("  Manager:   james.rivera@secops.gov / SecTrack2026!");
  console.log("  Contributor: maria.thompson@secops.gov / SecTrack2026!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
