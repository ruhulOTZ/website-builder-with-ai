-- CreateTable
CREATE TABLE "business_profile_records" (
    "id" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "profileJson" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "business_profile_records_pkey" PRIMARY KEY ("id")
);
