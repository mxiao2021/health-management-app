-- CreateTable
CREATE TABLE "PlanFeedback" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanFeedback_planId_idx" ON "PlanFeedback"("planId");

-- AddForeignKey
ALTER TABLE "PlanFeedback" ADD CONSTRAINT "PlanFeedback_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

