-- Drop unique constraints so same DISCOM code can appear in multiple districts
ALTER TABLE master_discoms DROP CONSTRAINT IF EXISTS master_discoms_name_key;
ALTER TABLE master_discoms DROP CONSTRAINT IF EXISTS master_discoms_code_key;

-- Add district link and extended DISCOM info
ALTER TABLE master_discoms ADD COLUMN IF NOT EXISTS district_id TEXT REFERENCES master_districts(id);
ALTER TABLE master_discoms ADD COLUMN IF NOT EXISTS full_form VARCHAR(200);
ALTER TABLE master_discoms ADD COLUMN IF NOT EXISTS headquarters VARCHAR(200);
