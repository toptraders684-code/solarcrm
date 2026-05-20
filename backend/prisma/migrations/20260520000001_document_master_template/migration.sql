-- Add template_content to store TipTap JSON templates for generate-type documents
ALTER TABLE document_master ADD COLUMN template_content JSONB;
