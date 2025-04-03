-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_userId_fkey";

-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
