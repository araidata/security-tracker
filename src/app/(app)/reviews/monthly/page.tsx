import { reviewService } from "@/lib/services/review.service";
import { PageHeader } from "@/components/shared/page-header";
import { GoalStatusBadge } from "@/components/shared/status-badge";
import { DepartmentBadge } from "@/components/shared/department-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthlyReviewDialog } from "@/components/reviews/monthly-review-dialog";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function MonthlyReviewsPage() {
  let reviews: any[] = [];
  try {
    reviews = await reviewService.listMonthly({
      fiscalYear: new Date().getFullYear(),
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <PageHeader
        title="Monthly Reviews"
        description="Summarized leadership view of goal progress"
      >
        <MonthlyReviewDialog />
      </PageHeader>

      {reviews.length === 0 ? (
        <EmptyState
          title="No monthly reviews yet"
          description="Create your first monthly review to track progress"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {MONTH_NAMES[review.month]} {review.fiscalYear}
                  </h3>
                  <DepartmentBadge department={review.goal.department} />
                </div>
                <GoalStatusBadge status={review.overallStatus} />
              </div>
              <p className="text-xs text-text-tertiary mb-2">
                Goal: {review.goal.title}
              </p>
              <p className="text-sm text-text-primary">{review.summary}</p>
              {review.highlights && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-status-on-track">Highlights:</span>
                  <p className="mt-0.5 text-sm text-text-secondary">{review.highlights}</p>
                </div>
              )}
              {review.concerns && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-status-at-risk">Concerns:</span>
                  <p className="mt-0.5 text-sm text-text-secondary">{review.concerns}</p>
                </div>
              )}
              {review.leadershipNotes && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-accent">Leadership Notes:</span>
                  <p className="mt-0.5 text-sm text-text-secondary">{review.leadershipNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
