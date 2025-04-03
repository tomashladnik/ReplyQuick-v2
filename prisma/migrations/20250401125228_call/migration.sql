/*
  Warnings:

  - You are about to drop the `CrmIntegration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CrmIntegration" DROP CONSTRAINT "CrmIntegration_userId_fkey";

-- DropTable
DROP TABLE "CrmIntegration";
