-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('NEW_APPLICATION', 'RENEWAL', 'RETIREMENT');

-- CreateEnum
CREATE TYPE "public"."DriverStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."FranchiseStatus" AS ENUM ('PENDING', 'FOR_BILLING', 'FOR_PAYMENT', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."PermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."TricycleStatus" AS ENUM ('PENDING', 'FOR_SP_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BodyNumber" (
    "bodyNumber" INTEGER NOT NULL,
    "franchiseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyNumber_pkey" PRIMARY KEY ("bodyNumber")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "driverId" TEXT,
    "tricycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Driver" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "licenseNo" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeRule" (
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
CREATE TABLE "public"."Franchise" (
    "id" TEXT NOT NULL,
    "franchiseNo" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "resolutionNo" TEXT,
    "approvedOn" TIMESTAMP(3),
    "areaOfOperation" TEXT,
    "currentApplicationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isRenewal" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseApplication" (
    "id" TEXT NOT NULL,
    "franchiseId" TEXT,
    "apptype" TEXT NOT NULL,
    "appyear" INTEGER NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "mtopNo" TEXT,
    "newFranchiseId" TEXT,
    "resolutionDate" TIMESTAMP(3),
    "resolutionNo" TEXT,

    CONSTRAINT "FranchiseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseTasks" (
    "id" TEXT NOT NULL,
    "taskname" TEXT NOT NULL,
    "taskdesc" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "newFranchiseId" TEXT,
    "office" TEXT NOT NULL,

    CONSTRAINT "FranchiseTasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FranchiseTransaction" (
    "id" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "orNumber" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemAccounts" (
    "id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "default_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fundtype" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MTOPVehicle" (
    "id" TEXT NOT NULL,
    "registeredOwnerName" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "engineNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "MTOPVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewFranchise" (
    "id" TEXT NOT NULL,
    "franchiseBodyNumber" INTEGER NOT NULL,
    "operatorId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mtopVehicleId" TEXT,
    "currentApplicationId" TEXT,

    CONSTRAINT "NewFranchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Operator" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "validIDType" TEXT NOT NULL,
    "validIDNumber" TEXT NOT NULL,
    "validIDExpiryDate" TIMESTAMP(3) NOT NULL,
    "profilePicture" TEXT,
    "validIdFront" TEXT,
    "validIdBack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encodedBy" TEXT NOT NULL,
    "encodedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permit" (
    "id" TEXT NOT NULL,
    "permitNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tricycleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "function" TEXT,
    "capability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tricycle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "plateNo" TEXT NOT NULL,
    "chassisNo" TEXT NOT NULL,
    "motorNo" TEXT NOT NULL,
    "bodyNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mainDriverId" TEXT,
    "extraDriverId" TEXT,
    "franchiseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tricycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactNo" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "office" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Violation" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "violationTypeId" TEXT NOT NULL,
    "driverId" TEXT,
    "tricycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ViolationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fineAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViolationType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyNumber_franchiseId_key" ON "public"."BodyNumber"("franchiseId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "public"."Driver"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNo_key" ON "public"."Driver"("licenseNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_currentApplicationId_key" ON "public"."Franchise"("currentApplicationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_email_key" ON "public"."Franchise"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_franchiseNo_key" ON "public"."Franchise"("franchiseNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_ownerName_key" ON "public"."Franchise"("ownerName" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseApplication_mtopNo_key" ON "public"."FranchiseApplication"("mtopNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseTransaction_orNumber_key" ON "public"."FranchiseTransaction"("orNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ItemAccounts_account_number_key" ON "public"."ItemAccounts"("account_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MTOPVehicle_operatorId_key" ON "public"."MTOPVehicle"("operatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MTOPVehicle_plateNumber_key" ON "public"."MTOPVehicle"("plateNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MTOPVehicle_registrationNumber_key" ON "public"."MTOPVehicle"("registrationNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MTOPVehicle_userId_key" ON "public"."MTOPVehicle"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewFranchise_currentApplicationId_key" ON "public"."NewFranchise"("currentApplicationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewFranchise_franchiseBodyNumber_key" ON "public"."NewFranchise"("franchiseBodyNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewFranchise_mtopVehicleId_key" ON "public"."NewFranchise"("mtopVehicleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewFranchise_operatorId_key" ON "public"."NewFranchise"("operatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_email_key" ON "public"."Operator"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_mobileNo_key" ON "public"."Operator"("mobileNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_name_key" ON "public"."Operator"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_operatorId_key" ON "public"."Operator"("operatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_validIDNumber_key" ON "public"."Operator"("validIDNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Permit_permitNo_key" ON "public"."Permit"("permitNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tricycle_bodyNumber_key" ON "public"."Tricycle"("bodyNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tricycle_chassisNo_key" ON "public"."Tricycle"("chassisNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tricycle_franchiseId_key" ON "public"."Tricycle"("franchiseId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tricycle_motorNo_key" ON "public"."Tricycle"("motorNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tricycle_plateNo_key" ON "public"."Tricycle"("plateNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "public"."UserRole"("userId" ASC, "roleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Violation_ticketNo_key" ON "public"."Violation"("ticketNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ViolationType_code_key" ON "public"."ViolationType"("code" ASC);

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BodyNumber" ADD CONSTRAINT "BodyNumber_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "public"."Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "public"."Tricycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Franchise" ADD CONSTRAINT "Franchise_currentApplicationId_fkey" FOREIGN KEY ("currentApplicationId") REFERENCES "public"."FranchiseApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseApplication" ADD CONSTRAINT "FranchiseApplication_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "public"."Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseApplication" ADD CONSTRAINT "FranchiseApplication_newFranchiseId_fkey" FOREIGN KEY ("newFranchiseId") REFERENCES "public"."NewFranchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseApplication" ADD CONSTRAINT "FranchiseApplication_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."FranchiseTasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseTasks" ADD CONSTRAINT "FranchiseTasks_newFranchiseId_fkey" FOREIGN KEY ("newFranchiseId") REFERENCES "public"."NewFranchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseTasks" ADD CONSTRAINT "FranchiseTasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FranchiseTransaction" ADD CONSTRAINT "FranchiseTransaction_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "public"."Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MTOPVehicle" ADD CONSTRAINT "MTOPVehicle_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MTOPVehicle" ADD CONSTRAINT "MTOPVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewFranchise" ADD CONSTRAINT "NewFranchise_currentApplicationId_fkey" FOREIGN KEY ("currentApplicationId") REFERENCES "public"."FranchiseApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewFranchise" ADD CONSTRAINT "NewFranchise_mtopVehicleId_fkey" FOREIGN KEY ("mtopVehicleId") REFERENCES "public"."MTOPVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewFranchise" ADD CONSTRAINT "NewFranchise_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permit" ADD CONSTRAINT "Permit_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "public"."Tricycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tricycle" ADD CONSTRAINT "Tricycle_extraDriverId_fkey" FOREIGN KEY ("extraDriverId") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tricycle" ADD CONSTRAINT "Tricycle_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "public"."Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tricycle" ADD CONSTRAINT "Tricycle_mainDriverId_fkey" FOREIGN KEY ("mainDriverId") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_tricycleId_fkey" FOREIGN KEY ("tricycleId") REFERENCES "public"."Tricycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_violationTypeId_fkey" FOREIGN KEY ("violationTypeId") REFERENCES "public"."ViolationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

