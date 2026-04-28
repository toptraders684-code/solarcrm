-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('upload', 'generate', 'view');

-- AlterTable: add doc_type column defaulting to upload
ALTER TABLE "document_master" ADD COLUMN "doc_type" "DocType" NOT NULL DEFAULT 'upload';

-- DataMigration: mark existing generate rows
UPDATE "document_master" SET "doc_type" = 'generate' WHERE "can_generate" = true;

-- AlterTable: drop old boolean column
ALTER TABLE "document_master" DROP COLUMN "can_generate";

-- AlterTable: add master file columns
ALTER TABLE "document_master" ADD COLUMN "master_file_path" VARCHAR(500);
ALTER TABLE "document_master" ADD COLUMN "master_file_mime" VARCHAR(100);
