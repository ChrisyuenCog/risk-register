-- Restricted projects: when true, only members (and admins) can access
ALTER TABLE "Project" ADD COLUMN "restricted" BOOLEAN NOT NULL DEFAULT false;
