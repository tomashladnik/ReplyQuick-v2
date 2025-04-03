/*
  Warnings:

  - A unique constraint covering the columns `[callSid]` on the table `calls` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "cost" DOUBLE PRECISION,
ADD COLUMN     "disconnectionReason" TEXT,
ADD COLUMN     "publicLogUrl" TEXT,
ADD COLUMN     "userSentiment" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "calls_callSid_key" ON "calls"("callSid");
