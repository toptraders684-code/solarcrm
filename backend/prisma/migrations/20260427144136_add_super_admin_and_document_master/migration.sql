-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'super_admin';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "master_item_id" TEXT;

-- CreateTable
CREATE TABLE "document_master" (
    "id" TEXT NOT NULL,
    "discom" "Discom" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "can_generate" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_doc_master_discom" ON "document_master"("discom");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "document_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
