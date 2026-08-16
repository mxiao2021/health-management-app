-- Split the single daily diet entry into breakfast/lunch/dinner, each with its own check-in.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PlanDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "exerciseTitle" TEXT NOT NULL,
    "exerciseDetail" TEXT NOT NULL,
    "breakfastTitle" TEXT NOT NULL,
    "breakfastDetail" TEXT NOT NULL,
    "lunchTitle" TEXT NOT NULL,
    "lunchDetail" TEXT NOT NULL,
    "dinnerTitle" TEXT NOT NULL,
    "dinnerDetail" TEXT NOT NULL,
    CONSTRAINT "PlanDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WeeklyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlanDay" ("id", "planId", "date", "dayIndex", "exerciseTitle", "exerciseDetail", "breakfastTitle", "breakfastDetail", "lunchTitle", "lunchDetail", "dinnerTitle", "dinnerDetail")
SELECT "id", "planId", "date", "dayIndex", "exerciseTitle", "exerciseDetail",
       'Breakfast', "dietDetail",
       "dietTitle", "dietDetail",
       'Dinner', "dietDetail"
FROM "PlanDay";
DROP TABLE "PlanDay";
ALTER TABLE "new_PlanDay" RENAME TO "PlanDay";
CREATE UNIQUE INDEX "PlanDay_planId_dayIndex_key" ON "PlanDay"("planId", "dayIndex");

CREATE TABLE "new_CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planDayId" TEXT NOT NULL,
    "exerciseDone" BOOLEAN NOT NULL DEFAULT false,
    "breakfastDone" BOOLEAN NOT NULL DEFAULT false,
    "lunchDone" BOOLEAN NOT NULL DEFAULT false,
    "dinnerDone" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckIn_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "PlanDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CheckIn" ("id", "planDayId", "exerciseDone", "breakfastDone", "lunchDone", "dinnerDone", "note", "updatedAt")
SELECT "id", "planDayId", "exerciseDone", "dietDone", "dietDone", "dietDone", "note", "updatedAt"
FROM "CheckIn";
DROP TABLE "CheckIn";
ALTER TABLE "new_CheckIn" RENAME TO "CheckIn";
CREATE UNIQUE INDEX "CheckIn_planDayId_key" ON "CheckIn"("planDayId");

PRAGMA foreign_keys=ON;
