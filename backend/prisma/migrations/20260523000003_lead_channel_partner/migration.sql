ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "channel_partner_id" UUID;
ALTER TABLE "leads" ADD CONSTRAINT "leads_channel_partner_id_fkey" FOREIGN KEY ("channel_partner_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
