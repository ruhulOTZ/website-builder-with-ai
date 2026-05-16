-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'REQUIREMENTS_SUBMITTED', 'PROFILE_GENERATED', 'PROFILE_CONFIRMED', 'BRIEF_GENERATED', 'BRIEF_CONFIRMED', 'COMPLETED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "rawRequirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");
