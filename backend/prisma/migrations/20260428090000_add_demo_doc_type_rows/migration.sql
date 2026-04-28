-- Demo rows: one per docType so all three are visible in the TPCODL grid
INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpcodl', 'Demo — Upload File Type', 'upload', 98, true, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "document_master" WHERE "discom" = 'tpcodl' AND "title" = 'Demo — Upload File Type'
);

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpcodl', 'Demo — Generate Document Type', 'generate', 99, true, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "document_master" WHERE "discom" = 'tpcodl' AND "title" = 'Demo — Generate Document Type'
);

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpcodl', 'Demo — View File Type', 'view', 100, true, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "document_master" WHERE "discom" = 'tpcodl' AND "title" = 'Demo — View File Type'
);
