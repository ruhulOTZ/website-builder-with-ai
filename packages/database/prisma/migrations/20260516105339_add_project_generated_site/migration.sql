-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'SITE_GENERATED';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "generatedSiteId" TEXT,
ADD COLUMN     "generatedSiteJson" JSONB;
