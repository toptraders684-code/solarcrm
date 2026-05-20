-- Add is_common flag so a document can apply to all DISCOMs at once
ALTER TABLE document_master ADD COLUMN is_common BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow discom to be null for common documents
ALTER TABLE document_master ALTER COLUMN discom DROP NOT NULL;
