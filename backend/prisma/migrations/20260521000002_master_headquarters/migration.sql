-- Add master_headquarters table
CREATE TABLE IF NOT EXISTS "master_headquarters" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_headquarters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "master_headquarters_name_key" ON "master_headquarters"("name");
