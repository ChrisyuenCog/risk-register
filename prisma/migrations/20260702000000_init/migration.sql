-- Initial schema for RiskRegister (matches prisma/schema.prisma)

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RISK_MANAGER', 'RISK_OWNER', 'ACTION_OWNER', 'GOVERNANCE', 'VIEWER');
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'CLOSED', 'ESCALATED');
CREATE TYPE "Ranking" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AssessmentKind" AS ENUM ('INHERENT', 'RESIDUAL');
CREATE TYPE "ActionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'OVERDUE');
CREATE TYPE "AssuranceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHANGES_PROPOSED', 'CONCERN');
CREATE TYPE "Rag" AS ENUM ('RED', 'AMBER', 'GREEN');

-- Tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "division" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

CREATE TABLE "RiskCategory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultAppetite" "Ranking" NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT "RiskCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RiskCategory_projectId_code_key" ON "RiskCategory"("projectId", "code");

CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impactDescription" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "impactArea" TEXT,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "ownerNames" TEXT NOT NULL,
    "appetiteMaxRanking" "Ranking" NOT NULL DEFAULT 'MEDIUM',
    "appetiteConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Risk_projectId_ref_key" ON "Risk"("projectId", "ref");

CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "kind" "AssessmentKind" NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "costImpact" INTEGER NOT NULL,
    "timeImpact" INTEGER NOT NULL,
    "qualityImpact" INTEGER NOT NULL,
    "reputationImpact" INTEGER NOT NULL,
    "costRanking" "Ranking" NOT NULL,
    "timeRanking" "Ranking" NOT NULL,
    "qualityRanking" "Ranking" NOT NULL,
    "reputationRanking" "Ranking" NOT NULL,
    "combinedImpact" INTEGER NOT NULL,
    "combinedRanking" "Ranking" NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,
    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MitigationAction" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "ownerName" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "ActionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MitigationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressNote" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distributedAt" TIMESTAMP(3),
    "meetingDate" TIMESTAMP(3),
    "decisionsNotes" TEXT,
    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssuranceRecord" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "status" "AssuranceStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "signedAt" TIMESTAMP(3),
    CONSTRAINT "AssuranceRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceRecord_cycleId_riskId_ownerName_key" ON "AssuranceRecord"("cycleId", "riskId", "ownerName");

CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "riskId" TEXT,
    "ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likelyImpact" TEXT,
    "severity" "Ranking" NOT NULL DEFAULT 'MEDIUM',
    "actions" TEXT,
    "actionOwner" TEXT,
    "rag" "Rag" NOT NULL DEFAULT 'GREEN',
    "targetDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "progress" TEXT,
    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Issue_riskId_key" ON "Issue"("riskId");
CREATE UNIQUE INDEX "Issue_projectId_ref_key" ON "Issue"("projectId", "ref");

CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "reason" TEXT,
    "action" TEXT,
    "agreedChange" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChangeRequest_projectId_ref_key" ON "ChangeRequest"("projectId", "ref");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RiskCategory" ADD CONSTRAINT "RiskCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RiskCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MitigationAction" ADD CONSTRAINT "MitigationAction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssuranceRecord" ADD CONSTRAINT "AssuranceRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssuranceRecord" ADD CONSTRAINT "AssuranceRecord_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
