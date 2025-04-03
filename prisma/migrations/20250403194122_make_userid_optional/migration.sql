-- DropForeignKey
ALTER TABLE "calls" DROP CONSTRAINT "calls_userId_fkey";

-- AlterTable
ALTER TABLE "calls" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
