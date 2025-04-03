/*
  Warnings:

  - You are about to drop the `crm_integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "crm_integrations" DROP CONSTRAINT "crm_integrations_user_id_fkey";

-- DropTable
DROP TABLE "crm_integrations";

-- CreateTable
CREATE TABLE "CrmIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmIntegration_userId_idx" ON "CrmIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmIntegration_userId_platform_key" ON "CrmIntegration"("userId", "platform");

-- AddForeignKey
ALTER TABLE "CrmIntegration" ADD CONSTRAINT "CrmIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
