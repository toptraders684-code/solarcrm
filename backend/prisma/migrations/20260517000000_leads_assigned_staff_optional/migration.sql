-- Allow leads to be created without an assigned staff member (e.g. by vendor users)
ALTER TABLE leads ALTER COLUMN assigned_staff_id DROP NOT NULL;
