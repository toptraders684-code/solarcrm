-- Move JE Inspection from stage 6 to after Installation Done (stage 9)
-- Old: 6=JE Inspection, 7=Approval Received, 8=Material Procurement, 9=Installation Done
-- New: 6=Approval Received, 7=Material Procurement, 8=Installation Done, 9=JE Inspection

-- Park JE Inspection applicants at 99 to avoid collisions during shift
UPDATE "applicants" SET "stage" = 99 WHERE "stage" = 6;
UPDATE "applicants" SET "stage" = 6  WHERE "stage" = 7;
UPDATE "applicants" SET "stage" = 7  WHERE "stage" = 8;
UPDATE "applicants" SET "stage" = 8  WHERE "stage" = 9;
UPDATE "applicants" SET "stage" = 9  WHERE "stage" = 99;
