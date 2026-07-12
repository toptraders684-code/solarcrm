-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'needs_reupload';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "rejection_reason" TEXT;
