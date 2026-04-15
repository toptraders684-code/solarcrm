-- CreateEnum
CREATE TYPE "ProjectActivityType" AS ENUM ('note', 'customer_contacted', 'site_visit', 'document_collected', 'payment_received', 'material_delivered', 'installation_update', 'inspection_done', 'other');

-- CreateTable
CREATE TABLE "project_activities" (
    "id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "activity_type" "ProjectActivityType" NOT NULL,
    "notes" TEXT,
    "follow_up_date" DATE,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_project_activities_applicant" ON "project_activities"("applicant_id");

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
