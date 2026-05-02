-- Make "Subsidy amount credited to customer bank account" mandatory across all DISCOMs and project types
UPDATE "checklist_master"
SET "is_mandatory" = true
WHERE "item_text" = 'Subsidy amount credited to customer bank account';
