/*
  Warnings:

  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "password",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
