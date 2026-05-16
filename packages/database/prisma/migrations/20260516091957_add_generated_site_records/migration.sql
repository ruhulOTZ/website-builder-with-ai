-- CreateTable
CREATE TABLE "generated_site_records" (
    "id" TEXT NOT NULL,
    "designBriefId" TEXT,
    "siteJson" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "generated_site_records_pkey" PRIMARY KEY ("id")
);
