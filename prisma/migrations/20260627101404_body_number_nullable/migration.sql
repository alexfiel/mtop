-- DropForeignKey
ALTER TABLE "BodyNumber" DROP CONSTRAINT "BodyNumber_franchiseId_fkey";

-- AlterTable
ALTER TABLE "BodyNumber" ALTER COLUMN "franchiseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BodyNumber" ADD CONSTRAINT "BodyNumber_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
