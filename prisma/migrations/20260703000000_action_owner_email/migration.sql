-- Owner email on mitigation actions, for due-date notifications
ALTER TABLE "MitigationAction" ADD COLUMN "ownerEmail" TEXT;
