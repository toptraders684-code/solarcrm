ALTER TABLE "users" ADD COLUMN "parent_vendor_user_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_parent_vendor_user_id_fkey"
  FOREIGN KEY ("parent_vendor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_users_parent_vendor_user" ON "users"("parent_vendor_user_id");
