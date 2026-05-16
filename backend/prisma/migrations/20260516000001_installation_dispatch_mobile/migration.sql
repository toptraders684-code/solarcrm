-- Add dispatch_customer_mobile_no to installation_details

ALTER TABLE "installation_details"
  ADD COLUMN "dispatch_customer_mobile_no" VARCHAR(15);
