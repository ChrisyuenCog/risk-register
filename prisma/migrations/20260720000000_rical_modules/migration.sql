-- RICAL modules: Action Log (meeting actions) and Lessons Learned
-- (ChangeRequest already exists from the init migration)
CREATE TABLE "ProjectAction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "raisedBy" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "targetDate" TIMESTAMP(3),
    "progress" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectAction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProjectAction_projectId_ref_key" ON "ProjectAction"("projectId", "ref");

CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "raisedBy" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerName" TEXT,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lesson_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Lesson_projectId_ref_key" ON "Lesson"("projectId", "ref");
