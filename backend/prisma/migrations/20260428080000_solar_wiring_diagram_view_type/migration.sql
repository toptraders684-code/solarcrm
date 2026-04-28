-- DataMigration: Solar Wiring Diagram is a pre-uploaded view-only file
UPDATE "document_master"
SET "doc_type" = 'view'
WHERE "discom" = 'tpcodl' AND "title" = 'Solar Wiring Diagram';
