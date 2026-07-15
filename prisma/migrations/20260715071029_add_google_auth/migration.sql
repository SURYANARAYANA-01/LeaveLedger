/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");
