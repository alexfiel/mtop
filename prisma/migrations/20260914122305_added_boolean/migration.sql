-- DropForeignKey
ALTER TABLE "NewFranchise" DROP CONSTRAINT "NewFranchise_operatorId_fkey";

-- AlterTable
ALTER TABLE "NewFranchise" ADD COLUMN     "assignedDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "operatorId" DROP NOT NULL,
ALTER COLUMN "zone" DROP NOT NULL,
ALTER COLUMN "zone" SET DEFAULT 'Tagbilaran City';

-- AddForeignKey
ALTER TABLE "NewFranchise" ADD CONSTRAINT "NewFranchise_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
