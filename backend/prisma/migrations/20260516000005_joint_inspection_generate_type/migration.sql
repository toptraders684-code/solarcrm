-- Change Joint Inspection Report (tpcodl) from upload to generate
-- so the backend generates it via PDFKit instead of requiring a manual upload
UPDATE document_master
SET doc_type = 'generate'
WHERE discom = 'tpcodl' AND title = 'Joint Inspection Report';
