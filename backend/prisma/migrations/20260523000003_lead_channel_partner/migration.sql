ALTER TABLE "leads" DROP COLUMN IF EXISTS "channel_partner_id";
ALTER TABLE "leads" ADD COLUMN "channel_partner_id" TEXT;
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_channel_partner_id_fkey";
ALTER TABLE "leads" ADD CONSTRAINT "leads_channel_partner_id_fkey" FOREIGN KEY ("channel_partner_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
