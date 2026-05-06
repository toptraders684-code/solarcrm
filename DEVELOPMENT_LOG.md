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
