-- Demo rows for TPNODL
INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpnodl', 'Demo — Upload File Type', 'upload', 98, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpnodl' AND "title" = 'Demo — Upload File Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpnodl', 'Demo — Generate Document Type', 'generate', 99, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpnodl' AND "title" = 'Demo — Generate Document Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpnodl', 'Demo — View File Type', 'view', 100, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpnodl' AND "title" = 'Demo — View File Type');

-- Demo rows for TPSODL
INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpsodl', 'Demo — Upload File Type', 'upload', 98, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpsodl' AND "title" = 'Demo — Upload File Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpsodl', 'Demo — Generate Document Type', 'generate', 99, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpsodl' AND "title" = 'Demo — Generate Document Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpsodl', 'Demo — View File Type', 'view', 100, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpsodl' AND "title" = 'Demo — View File Type');

-- Demo rows for TPWODL
INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpwodl', 'Demo — Upload File Type', 'upload', 98, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpwodl' AND "title" = 'Demo — Upload File Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpwodl', 'Demo — Generate Document Type', 'generate', 99, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpwodl' AND "title" = 'Demo — Generate Document Type');

INSERT INTO "document_master" ("id", "discom", "title", "doc_type", "sort_order", "is_active", "created_at")
SELECT gen_random_uuid(), 'tpwodl', 'Demo — View File Type', 'view', 100, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "document_master" WHERE "discom" = 'tpwodl' AND "title" = 'Demo — View File Type');
