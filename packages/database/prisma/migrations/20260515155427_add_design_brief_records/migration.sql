-- CreateTable
CREATE TABLE "design_brief_records" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT,
    "briefJson" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "design_brief_records_pkey" PRIMARY KEY ("id")
);
