-- Add new VendorType enum values
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'channel_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'district_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'block_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'installation_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'transport_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'insurance_partner';
ALTER TYPE "VendorType" ADD VALUE IF NOT EXISTS 'netmeter_partner';
