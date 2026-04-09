import { reviewService } from "@/lib/services/review.service";
import { PageHeader } from "@/components/shared/page-header";
import { GoalStatusBadge, RockStatusBadge } from "@/components/shared/status-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { QuarterlyReviewDialog } from "@/components/reviews/quarterly-review-dialog";
import { formatPercent } from "@/lib/utils";

export default async function QuarterlyReviewsPage() {
  let reviews: any[] = [];
  try {
    reviews = await reviewService.listQuarterly({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="Quarterly Reviews"
        description="Outcome tracking with planned vs actual results"
      >
        <QuarterlyReviewDialog />
      </PageHeader>

      {reviews.length === 0 ? (
        <EmptyState
          title="No quarterly reviews yet"
          description="Create your first quarterly review to track outcomes"
        />
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {review.quarter} {review.fiscalYear}
                  </h3>
                  <DepartmentBadge department={review.goal.department} />
                </div>
                <GoalStatusBadge status={review.overallStatus} />
              </div>
              <p className="text-xs text-text-tertiary mb-3">
                Goal: {review.goal.title}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                    Planned Outcomes
                  </h4>
                  <p className="text-sm text-text-primary">{review.plannedOutcomes}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                    Actual Outcomes
                  </h4>
                  <p className="text-sm text-text-primary">{review.actualOutcomes}</p>
                </div>
              </div>

              {review.lessonsLearned && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-status-at-risk uppercase tracking-wider mb-1">
                    Lessons Learned
                  </h4>
                  <p className="text-sm text-text-secondary">{review.lessonsLearned}</p>
                </div>
              )}

              {review.adjustments && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-accent uppercase tracking-wider mb-1">
                    Adjustments / Carry-Forward
                  </h4>
                  <p className="text-sm text-text-secondary">{review.adjustments}</p>
                </div>
              )}

              {/* Rock Snapshots */}
              {review.rocks.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <h4 className="mb-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Rock Snapshots
                  </h4>
                  <div className="space-y-2">
                    {review.rocks.map((rs: any) => (
                      <div
                        key={rs.id}
                        className="flex items-center justify-between rounded-lg bg-background-tertiary p-2.5"
                      >
                        <span className="text-sm text-text-primary">
                          {rs.rock.title}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-tertiary">
                            Planned: {formatPercent(rs.plannedCompletion)} &rarr; Actual:{" "}
                            {formatPercent(rs.actualCompletion)}
                          </span>
                          <RockStatusBadge status={rs.statusAtReview} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
