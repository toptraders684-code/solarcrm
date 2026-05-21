# Suryam CRM — Development Log

## Session: UI & Workflow Improvements (May 2026)

---

### 1. Custom Date Picker (`DateSelectPicker`)

**File:** `frontend/src/components/ui/date-select-picker.tsx`

- Replaced the old `DatePicker` component and all `<Input type="date">` usages across the entire app.
- Full calendar popup with:
  - 7-column square day grid with month navigation arrows
  - Decade drill-down year picker (click the year header to browse decades)
  - Manual text entry (`DD/MM/YYYY`) with auto-inserting `/` separators
- Fixed page flicker on date selection by removing the `useEffect([value])` dependency that caused a second render.
- **Files updated:** `DetailsTab`, `DiscomTab`, `FinanceTab`, `EditApplicantSheet`, `ProjectActivityTimeline`, `FinancePage`, `ActivityLogsPage`, `ReportsPage`, `LeadDetailPage`, `AddLeadForm`

---

### 2. Stage Advance Validation (Frontend + Backend)

**Files:** `ApplicantDetailPage.tsx`, `applicants.service.ts`

#### Frontend (`ApplicantDetailPage.tsx`)
- Added `STAGE_REQUIRED` map: required DB fields per stage before advance is allowed.
- Added `STAGE_TO_PHASE` map: corrects the mismatch between applicant stage numbers and checklist `phaseOrder` values (stages 1 and 2 are swapped in the checklist seed).
  ```ts
  const STAGE_TO_PHASE: Record<number, number> = { 1: 2, 2: 1 };
  // Stage 1 → Survey Done  needs Site Survey checklist (phaseOrder 2)
  // Stage 2 → Docs Collected needs Document Collection (phaseOrder 1)
  // Stages 3–10 align directly
  ```
- Fetches checklist data at page level to compute `mandatoryIncomplete` (mandatory items in the correct phase that are not yet ticked).
- **Advance Stage button** — always enabled; opens a confirmation dialog.
- **Confirm dialog** (`ConfirmDialog`) — shows exactly what's blocking:
  - Missing DB fields (e.g. "Portal Application Date not filled — go to DISCOM Application tab")
  - Incomplete mandatory checklist items (e.g. "Aadhaar Card collected — go to Checklist tab")
  - Green "All clear" message when nothing is blocking
- Confirm button inside dialog is disabled when blockers exist.
- `onError` handler parses backend error text and sets the active tab to `discom` or `checklist` automatically.
- Tabs switched to controlled mode (`value={activeTab}` / `onValueChange={setActiveTab}`).

#### Backend (`applicants.service.ts`)
- `advanceStage()` validates required fields before checklist check.
- Checklist validation uses **master-items-first** approach (old code missed untouched items that have no `applicantChecklist` row):
  1. Find all mandatory `checklistMaster` items for the correct phase
  2. Find which ones have `isCompleted: true` in `applicantChecklist`
  3. Throw `BadRequestException` listing any uncompleted items
- Uses the same `STAGE_TO_PHASE` mapping as the frontend.

---

### 3. `ConfirmDialog` — Rich Content Support

**File:** `frontend/src/components/shared/ConfirmDialog.tsx`

- `description` prop changed from `string` to `React.ReactNode` (allows JSX content).
- Added `confirmDisabled?: boolean` prop so the confirm button can be disabled independently of `loading`.

---

### 4. `ChecklistTab` — Auto-expand & Workflow Order

**File:** `frontend/src/pages/applicants/components/ChecklistTab.tsx`

- Added `focusStage` prop; on load (or stage change) the phase matching `focusStage` is automatically expanded.
- Used `useRef` to prevent re-expanding when the user manually collapses a phase.
- Checklist sections now render in **workflow order** using a `PHASE_DISPLAY_ORDER` map:
  - Site Survey (phaseOrder 2) displays first
  - Document Collection (phaseOrder 1) displays second
  - Technical Design → Subsidy Claim follow in natural phaseOrder order

---

### 5. Details Tab — Accordion Reordered

**File:** `frontend/src/pages/applicants/components/DetailsTab.tsx`

Accordion order aligned to project workflow (stages 1 → 11):

| Order | Section | Workflow Stage |
|-------|---------|---------------|
| 1 | Personal Information | Stage 1 — Lead Converted |
| 2 | Address | Stage 1 — Lead Converted |
| 3 | Survey Information | Stage 2 — Survey Done |
| 4 | Installation Details | Stage 3+ — Design/Installation |
| 5 | DISCOM Application | Stages 4–10 |
| 6 | Finance Details | Throughout |

---

### 6. React Query Cache Bug Fix (Multi-user Data Leak)

**Files:** `frontend/src/main.tsx`, `frontend/src/store/authStore.ts`

**Problem:** When admin A logged out and admin B logged in, React Query's 30-second `staleTime` cache still held admin A's data. Admin B briefly saw admin A's records until the background refetch completed.

**Fix:**
- `queryClient` exported from `main.tsx`.
- `clearAuth()` in `authStore.ts` now calls `queryClient.clear()` — wipes the entire cache at logout.
- Covers all 6 logout callsites automatically since they all call `clearAuth()`.

---

### 7. Admin Users Page — Edit & Delete

**Files:** `frontend/src/pages/admin/AdminUsersPage.tsx`, `frontend/src/services/users.service.ts`

- Super admin can now **edit** admin details (name, mobile, email, optional new password) via a dialog.
- Super admin can **delete** admins via a `ConfirmDialog` with `variant="danger"`.
- Added `usersService.deleteUser(id)` calling `DELETE /users/:id` (soft-delete, already existed in backend).

---

### 8. Settings Page (Admin Staff Management) — Edit & Delete

**File:** `frontend/src/pages/settings/SettingsPage.tsx`

- Admin can **edit** any staff member's details (name, mobile, email, role, optional new password) via a side sheet.
- Admin can **delete** staff via a confirm dialog.
- Edit and delete buttons appear in both the "Pending Approvals" section and the "All Users" table.
- Own account row shows "You" label — no edit/delete buttons for self.
- Extracted `actionBtnClass()` helper for consistent button styling across all 3 action variants.

---

### 9. Change Password — All Users

**Files:**
- `backend/src/users/users.controller.ts` — `PATCH /users/me/password`
- `backend/src/users/users.service.ts` — `changePassword(userId, currentPassword, newPassword)`
- `frontend/src/services/users.service.ts` — `changePassword()`
- `frontend/src/pages/profile/ChangePasswordPage.tsx`
- `frontend/src/App.tsx` — route `/change-password`
- `frontend/src/components/layout/Sidebar.tsx` — `KeyRound` icon link

**Backend logic:** Verifies current password with bcrypt → returns `401` if wrong → hashes new password → updates. Minimum 8 characters enforced.

**Frontend:** Three fields (current password, new password, confirm), all with visibility toggles. Confirm field validates match client-side. Form clears on success.

**Sidebar:** "Change Password" link with `KeyRound` icon visible to all user roles, positioned above Support.

---

### 10. Header — Search Bar Removed

**File:** `frontend/src/components/layout/Header.tsx`

- Removed the non-functional global search bar and its `Search` import.
- Added `ml-auto` to the right-side action bar to keep notifications and user avatar right-aligned.

---

### 11. Dark / Light Mode Toggle

**Files:**
- `frontend/src/index.css` — `.dark {}` CSS variable overrides
- `frontend/src/hooks/useTheme.ts` — `useTheme()` hook
- `frontend/src/components/layout/Header.tsx` — Sun/Moon toggle button

**How it works:**
- `useTheme()` reads `localStorage('theme')` on first load; falls back to `prefers-color-scheme`.
- Toggles `.dark` class on `<html>` element.
- Persists preference to `localStorage`.
- All colors change instantly since the entire design system uses CSS custom properties.

**Dark mode color palette:**
- Surface: `#121712` (dark green-tinted)
- Primary: `#4fc87f` (lighter green for contrast on dark bg)
- On-surface: `#e1e3e1`
- Error: `#ffb4ab`

---

---

## Session: Railway Deployment Fixes (May 2026)

### 12. Fix `calendar.tsx` — react-day-picker v9 API

**File:** `frontend/src/components/ui/calendar.tsx`

- `IconLeft` / `IconRight` were removed in react-day-picker v9.
- Replaced with the new unified `Chevron` component that accepts an `orientation` prop.
- This was causing the Docker build to fail with a TypeScript compilation error, blocking all Railway deployments.

---

### 13. Fix `seed.js` — ChecklistMaster no longer has `companyId`

**File:** `backend/prisma/seed.js`

**Problem:** Migration `20260505000000_master_data_multitenancy` dropped `company_id` from the `checklist_master` table (checklists are now global, not per-company). The seed script still queried `prisma.checklistMaster.count({ where: { companyId: ... } })` and passed `companyId` in `create()`, causing a `PrismaClientValidationError` on every container startup. The seed crashed, the `&&` chain stopped, and NestJS never started.

**Fix:**
- Changed count check to `prisma.checklistMaster.count()` (no filter).
- Removed `companyId` from `checklistMaster.create()` data payload.

---

---

## Session: Vendor Roles, Document Generation & File Naming (May 2026)

### 14. Vendor Role — Lead, Project, Document & Report Access

**Files:** `frontend/src/pages/leads/LeadsListPage.tsx`, `backend/src/reports/reports.controller.ts`, `backend/src/reports/reports.service.ts`

- `vendor` role can now add Leads (added `'vendor'` to `canAddLead` check in `LeadsListPage`).
- Reports were broken for all roles — frontend called `GET /reports/generate` and `GET /reports/download` but backend only had `POST /reports/preview`. Fixed by adding the correct GET endpoints with full implementations for all 8 report types: `lead_summary`, `conversion_funnel`, `stage_aging`, `project_profitability`, `subsidy_tracker`, `vendor_payment`, `staff_performance`, `discom_wise`.

---

### 15. Documents Tab — 3 Upload Folders + View & Generate

**Files:**
- `backend/src/documents/document-generator.service.ts` (NEW)
- `backend/src/applicants/applicants.controller.ts`
- `backend/src/applicants/applicants.module.ts`
- `backend/src/document-master/document-master.controller.ts`
- `frontend/src/pages/applicants/components/DocumentsTab.tsx`
- `frontend/src/services/applicants.service.ts`
- `Dockerfile`, `backend/prisma/seed.js`, `backend/prisma/migrations/20260516000005_joint_inspection_generate_type/`

#### Upload folder structure
Three separate `uploads/` subdirectories:
- `uploads/applicants/` — user-uploaded documents (docType `upload`)
- `uploads/master/` — static admin-uploaded files (docType `view`)
- `uploads/generated/` — placeholder for future cached generated PDFs

Dockerfile now creates all three at both build time (`RUN mkdir -p`) and container startup (`CMD mkdir -p`) to ensure they exist even when a Railway volume is mounted over `uploads/`.

#### Solar Wiring Diagram (docType `view`)
Row 21 in the tpcodl document list. Admin uploads a static PDF via `POST /document-master/:id/file`. The file is stored at `uploads/master/{id}/view/{filename}` and the DB columns `master_file_path` + `master_file_mime` are set. On Railway, the file must be uploaded through the admin UI after first deploy (it cannot be bundled in the Docker image since uploads live on a Railway Volume).

#### Joint Inspection Report (docType `generate`)
Row 15 in the tpcodl document list. Changed from `upload` to `generate` (migration `20260516000005` + seed.js updated).

`DocumentGeneratorService` (`backend/src/documents/document-generator.service.ts`) is the single file for all PDF generation:
- `generate(applicantId, masterItemId, companyId)` — routes by `masterItem.title` via a `switch`
- `jointInspectionReport(applicant)` — PDFKit A4, reads: `customerName`, `existingConsumerNo`, full address, `panelTotalCapacityKw`/`inverterCapacityKw` (falls back to `systemCapacityKw`), primary vendor `businessName`+`contactPerson`, `contractAmount`, sum of approved subsidy transactions
- `placeholderPdf(title)` — fallback for unimplemented generate types
- **Adding new generated documents:** add a `case 'Document Title':` in the switch and a private method — no other files need changing

PDFs are generated in memory and streamed directly to the client; `uploads/generated/` is reserved for future caching.

---

### 16. Download Filename — Title + Datetime

**Files:** `backend/src/applicants/applicants.controller.ts`, `backend/src/document-master/document-master.controller.ts`, `frontend/src/pages/applicants/components/DocumentsTab.tsx`

All document views and downloads now use `{Document_Title}_{YYYY-MM-DD_HH-MM-SS}.ext` as the filename instead of the encrypted storage name.

- Backend: `buildDocFilename(title, ext)` helper in both controllers sets `Content-Disposition: inline; filename="..."`.
- Frontend: `buildFilename(title, mimeType)` helper in `DocumentsTab` sets the `filename` field on the `viewFile` state. A Download button (`<a download={viewFile.filename}>`) in the viewer modal allows saving with the correct name.

---

---

## Session: Bug Fixes — Vendor Team, Lead Assignment & PDF Viewer (May 2026)

### 17. PDF Viewer — "This content is blocked" Fix

**File:** `backend/src/main.ts`

Helmet's default CSP blocked `blob:` URLs in iframes, causing Chrome to show "This content is blocked" when viewing generated or downloaded PDFs in the viewer modal on Railway (HTTPS). Fixed by explicitly adding `frameSrc` and `workerSrc` directives that allow `blob:` while keeping all other Helmet defaults unchanged.

---

### 18. Vendor Team Page — Admin Can Manage Vendor Teams

**Files:** `frontend/src/pages/vendor/VendorTeamPage.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `backend/src/users/users.controller.ts`, `backend/src/users/users.service.ts`

- Admin and operations_staff now have a **"Vendor Team"** link in the sidebar.
- When admin opens the page, a **vendor selector** dropdown appears at the top. Selecting a vendor loads that vendor's team and pre-fills the vendor in the Add Member dialog.
- "Add Member" button is disabled until a vendor is selected (prevents "Vendor is required" backend error).
- `getVendorTeam` backend fix: removed early `return { data: [] }` when `callerVendorId` is null. Admin calls without `?vendorId` now return all vendor-role users across the company (used by SettingsPage "Vendor Team Members" grid). Calls with `?vendorId` return only that vendor's team.
- `createVendorUser` now checks `isStaff = callerRole === 'admin' || callerRole === 'operations_staff'` to resolve vendorId from `dto.vendorId`.
- `operations_staff` role added to both vendor-team endpoints.

---

### 19. Vendor-Created Leads — No Assigned Staff Required

**Files:** `backend/src/leads/dto/create-lead.dto.ts`, `backend/src/leads/dto/update-lead.dto.ts`, `backend/src/leads/leads.service.ts`, `backend/prisma/schema.prisma`, `frontend/src/pages/leads/components/AddLeadForm.tsx`, `frontend/src/utils/validators.ts`
**Migration:** `20260517000000_leads_assigned_staff_optional`

- Vendor and vendor team members no longer see the "Assigned Staff" field when creating a lead — it is hidden for `vendor` role.
- `assigned_staff_id` DB column is now nullable (`ALTER TABLE leads ALTER COLUMN assigned_staff_id DROP NOT NULL`).
- Prisma schema: `assignedStaffId String?` / `assignedStaff User?`.
- Backend DTO: `@IsOptional()` on `assignedStaffId` in both `CreateLeadDto` and `UpdateLeadDto`.
- Email notification to assigned staff only fires when `assignedStaffId` is present.
- Admin assigns staff to vendor-created leads via the pencil icon in the "Assigned To" column of the Leads grid (hover to reveal).

---

### 20. Lead Edit — `alternateMobile` Validation Error

**File:** `backend/src/leads/dto/update-lead.dto.ts`

`alternateMobile` was present in `CreateLeadDto` but missing from `UpdateLeadDto`. With `forbidNonWhitelisted: true` globally, editing a lead sent `alternateMobile` and got rejected with "property alternateMobile should not exist". Fixed by adding the field to `UpdateLeadDto`.

---

### 21. Error Messages — GlobalExceptionFilter Response Shape

**Files:** `frontend/src/pages/leads/components/AddLeadForm.tsx`, `frontend/src/pages/leads/LeadsListPage.tsx`

`GlobalExceptionFilter` returns `{ error: { code, message } }` but frontend catch blocks were reading `err.response.data.message` (wrong path). Fixed to check `err.response.data.error.message` first, then fall back to `err.response.data.message`.

---

## Current Running State (as of May 2026)

| Environment | Status | Notes |
|-------------|--------|-------|
| **Local** | Active development | New features built and tested here first |
| **Railway (Production)** | Running | Commit `d0197bf` — all migrations applied |

> **Deployment workflow:** Local changes accumulate here. GitHub push + Railway deploy only happen when explicitly requested. Each push section below will note what was deployed and when.
>
> **Post-deploy action required on Railway:** Upload the Solar Wiring Diagram PDF through Admin → Document Master → Solar Wiring Diagram → Upload File.

---

## Key Architecture Notes

### Stage ↔ Checklist Phase Mapping

The checklist `phaseOrder` in the seed data does **not** match applicant stage numbers for stages 1 and 2:

| Applicant Stage | Stage Name | Required Checklist Phase | Phase Name |
|----------------|-----------|------------------------|-----------|
| 1 | Lead Converted → Survey Done | phaseOrder **2** | Site Survey |
| 2 | Survey Done → Documents Collected | phaseOrder **1** | Document Collection |
| 3–10 | … | phaseOrder **= stage** | (direct match) |

This mapping is applied in **both** frontend (`ApplicantDetailPage`) and backend (`applicants.service.ts`) via:
```ts
const STAGE_TO_PHASE: Record<number, number> = { 1: 2, 2: 1 };
const checklistPhase = STAGE_TO_PHASE[stage] ?? stage;
```

### React Query Cache Isolation

The `queryClient` instance is exported from `main.tsx` and imported by `authStore.ts`. `clearAuth()` always calls `queryClient.clear()` to prevent data leaking between user sessions.

### CSS Variable Theming

All design tokens are CSS custom properties defined in `index.css` under `@theme {}` (light) and `.dark {}` (dark). Tailwind classes like `bg-surface`, `text-on-surface-variant` etc. resolve to these variables at runtime — toggling the `.dark` class on `<html>` switches the entire theme without any component changes.

---

---

## Session: Applicant Details Expansion & Invoice Tab (May 2026)

### 22. Personal Information — Additional Fields

**Files:** `frontend/src/pages/applicants/components/DetailsTab.tsx`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migrations:** `20260521000006_applicant_customer_profession`, `20260521000007_applicant_signature`

Added to the **Personal Information** accordion:
- **Customer Name** — `customerName` (already in DB, surfaced in edit form)
- **PAN Number** — `panToken` (encrypted, existing field)
- **Aadhaar Number** — `aadhaarToken` (encrypted, existing field)
- **Customer Profession** — `customerProfession` (new `VARCHAR(200)` column)
- **Signature** — `signatureFileKey` image upload; stored at `uploads/signatures/{applicantId}/signature.{ext}`

Signature upload uses `useRef` + programmatic click (not a `<label>` wrapper) because buttons nested inside labels do not reliably trigger file inputs in all browsers. Preview image is displayed to the right of the upload button. On Railway the `uploads/signatures/` directory is created at container startup.

---

### 23. Address Section — GP & Block Fields

**Files:** `frontend/src/pages/applicants/components/DetailsTab.tsx`, `frontend/src/pages/applicants/components/EditApplicantSheet.tsx`, `backend/prisma/schema.prisma`
**Migration:** `20260521000003_applicant_address_gp_block`

Added `addressGp` (Gram Panchayat) and `addressBlock` fields to the Address accordion and edit sheet.

---

### 24. New Accordion — Area Details

**Files:** `frontend/src/pages/applicants/components/DetailsTab.tsx`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migration:** `20260521000004_applicant_area_details`

New accordion between Address and Survey Information:

| Field | DB Column | Type |
|-------|-----------|------|
| House/Flat/Plot No. | `area_house_no` | VARCHAR(100) |
| Roof Size (sq. ft.) | `area_roof_size_sqft` | FLOAT |
| No. of Floors | `area_no_of_floors` | INT (dropdown 1–5) |
| Roof Type | `area_roof_type` | VARCHAR(50) (RCC / Pakka) |
| House Height | `area_house_height` | VARCHAR(50) |

---

### 25. New Accordion — Bank Details

**Files:** `frontend/src/pages/applicants/components/DetailsTab.tsx`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migration:** `20260521000005_applicant_bank_details`

New accordion after Area Details with bank account and co-applicant fields:

| Field | DB Column |
|-------|-----------|
| Name in Bank Account | `bank_name_in_account` |
| Bank & Branch Name | `bank_branch_name` |
| Account Number | `bank_account_number` |
| IFSC Code | `bank_ifsc_code` |
| Co-Applicant Name | `co_applicant_name` |
| Relationship | `co_applicant_relationship` |
| Co-Applicant Mobile | `co_applicant_mobile` |
| Date of Birth | reuses existing `date_of_birth` |
| Co-Applicant Occupation | `co_applicant_occupation` |

---

### 26. Removed DISCOM Application Accordion from Details Tab

**File:** `frontend/src/pages/applicants/components/DetailsTab.tsx`

The "DISCOM Application" accordion was removed from the Details tab because all DISCOM fields are already present in the dedicated **DISCOM Application** tab. The `Section` union type was updated to remove `'discom'`.

---

### 27. DISCOM Tab — New "DISCOM Details" Card

**Files:** `frontend/src/pages/applicants/components/DiscomTab.tsx`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migration:** `20260521000008_applicant_discom_details`

New card inserted between "Portal Application" and "Site Survey" cards:

| Field | DB Column |
|-------|-----------|
| MNRE Application No (PMSURYA GARH) | `mnre_application_no` |
| DISCOM Application No (Reference No) | `discom_application_no` |
| MNRE Application Submit Date | `mnre_submit_date` |
| DISCOM Division Name | `discom_division` |
| DISCOM Sub Division Name | `discom_sub_division` |
| DISCOM Section | `discom_section` |
| DISCOM Contact Person Name | `discom_contact_person` |
| DISCOM Mobile No | `discom_mobile_no` |

---

### 28. New Tab — Invoice

**Files:** `frontend/src/pages/applicants/components/InvoiceTab.tsx` (NEW), `frontend/src/pages/applicants/ApplicantDetailPage.tsx`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migration:** `20260521000009_applicant_invoice`

New **Invoice** tab (between Finance and Status History) with the following fields:

| Field | DB Column | Notes |
|-------|-----------|-------|
| Invoice No | `invoice_no` | VARCHAR(100) |
| Solar Rate | `solar_rate` | DECIMAL — unit rate |
| Solar GST (%) | `solar_gst` | DECIMAL — percentage |
| Installation Rate | `installation_rate` | DECIMAL — unit rate |
| Installation GST (%) | `installation_gst` | DECIMAL — percentage |
| Project Cost | `contract_amount` | Read-only; edit via Finance Details |

Helper formatters `fmt()` (₹ formatted) and `fmtPct()` (percentage) used for display. `canEdit` restricted to `admin` / `operations_staff`.

---

### 29. Installation Details — Additional Wire/Cable Fields

**Files:** `frontend/src/pages/applicants/components/InstallationSection.tsx`, `frontend/src/types/index.ts`, `backend/src/applicants/dto/update-applicant.dto.ts`, `backend/prisma/schema.prisma`
**Migration:** `20260521000010_installation_wire_cables`

Three new fields added to the **G. PVC / Connectors / Wires** sub-section of Installation Details:

| Field | DB Column |
|-------|-----------|
| 16mm Earthing Cable | `wire_16mm_earthing_cable` |
| DC Cable 4 Sq mm | `wire_dc_cable_4sqmm` |
| AC Cable Copper | `wire_ac_cable_copper` |

---

### Migrations Added This Session

| Migration | Description |
|-----------|-------------|
| `20260521000001_master_discom_district` | DISCOM master with district linkage |
| `20260521000002_master_headquarters` | HQ field on DISCOM master |
| `20260521000003_applicant_address_gp_block` | GP and Block address fields |
| `20260521000004_applicant_area_details` | Area details section fields |
| `20260521000005_applicant_bank_details` | Bank + co-applicant fields |
| `20260521000006_applicant_customer_profession` | Customer profession field |
| `20260521000007_applicant_signature` | Signature file key + upload endpoint |
| `20260521000008_applicant_discom_details` | DISCOM detail fields (MNRE, division, JE etc.) |
| `20260521000009_applicant_invoice` | Invoice fields (invoice no, rates, GST) |
| `20260521000010_installation_wire_cables` | Three new wire/cable fields on installation_details |
