/*
  Warnings:

  - You are about to drop the column `driverId` on the `Tricycle` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FranchiseStatus" AS ENUM ('PENDING', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TricycleStatus" AS ENUM ('PENDING', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NEW_APPLICATION', 'RENEWAL', 'RETIREMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SECRETARY';
ALTER TYPE "Role" ADD VALUE 'INSPECTOR';
ALTER TYPE "Role" ADD VALUE 'CLERK';

-- DropForeignKey
ALTER TABLE "Tricycle" DROP CONSTRAINT "Tricycle_driverId_fkey";

-- AlterTable
ALTER TABLE "Franchise" ADD COLUMN     "isRenewal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tricycle" DROP COLUMN "driverId",
ADD COLUMN     "extraDriverId" TEXT,
ADD COLUMN     "mainDriverId" TEXT;

-- CreateTable
CREATE TABLE "BodyNumber" (
    "bodyNumber" INTEGER NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyNumber_pkey" PRIMARY KEY ("bodyNumber")
);

-- CreateTable
CREATE TABLE "FeeRule" (
    "id" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyNumber_franchiseId_key" ON "BodyNumber"("franchiseId");

-- AddForeignKey
ALTER TABLE "BodyNumber" ADD CONSTRAINT "BodyNumber_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_mainDriverId_fkey" FOREIGN KEY ("mainDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tricycle" ADD CONSTRAINT "Tricycle_extraDriverId_fkey" FOREIGN KEY ("extraDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
