# PeerMock Platform — Corrections & Features Roadmap

> Comprehensive tracking list for UI polish, core functionalities, real-time presence, email delivery, and UX improvements.

---

## 📋 Master Task List

| # | Task | Category | Files Impacted | Status |
|---|------|----------|----------------|--------|
| **1** | Fix Navbar Profile Picture sizing (was blowing up due to invalid Tailwind classes) | UI / Styling | `apps/web/src/components/Navbar.tsx` | ✅ Completed |
| **2** | Remove Supabase Cloud Status Banner from home screen | UI / Polish | `apps/web/src/App.tsx` | ✅ Completed |
| **3** | Build Sleek Nocturne Custom Select / Dropdown component | UI / Components | `apps/web/src/components/ui/CustomSelect.tsx`, `CreateSlotModal.tsx`, `ProfileView.tsx` | ✅ Completed |
| **4** | Replace Browser Native `alert()` & `confirm()` with Modern Toast/Modal Dialogs | UI / UX | `apps/web/src/context/AlertContext.tsx`, `App.tsx`, `SlotApplicantsModal.tsx`, `MySessionsView.tsx`, `OnboardingModal.tsx`, `RequestMockModal.tsx` | ✅ Completed |
| **5** | Applicant Full Profile Inspection Modal before accepting | Feature / Matching | `apps/web/src/components/ApplicantProfileModal.tsx`, `SlotApplicantsModal.tsx` | ✅ Completed |
| **6** | Reject Candidate Option with Note & Rejection Email Notification | Feature / Matching | `SlotApplicantsModal.tsx`, `packages/workers/src/index.ts`, `useSlots.ts`, `emailService.ts` | ✅ Completed |
| **7** | Redesigned Post-Session Feedback & Profile Calibration Modal | Feature / Reviews | `apps/web/src/components/ReviewModal.tsx`, `App.tsx` | ✅ Completed |
| **8** | Fix Resend Email Dispatch (Requested, Accepted & Rejected events) | Backend / Notifications | `packages/workers/src/index.ts`, `emailService.ts`, `useSlots.ts`, `useAuth.ts` | ✅ Completed |
| **9** | Notification Popover Click-to-Redirect (navigate to sessions/slot on click) | UX / Navigation | `apps/web/src/components/NotificationPopover.tsx`, `Navbar.tsx`, `App.tsx` | ✅ Completed |
| **10** | Real-Time Peer Online Presence Engine (live user count & green/gray indicators) | Engine / Realtime | `apps/web/src/context/PresenceContext.tsx`, `Navbar.tsx`, `SlotCard.tsx`, `SlotRow.tsx`, `App.tsx` | ✅ Completed |
| **11** | Dynamic Banner Metrics Engine (mocks this week, slots today, median match time) | Feature / Analytics | `apps/web/src/components/MarketplaceView.tsx` | ✅ Completed |
| **12** | Smooth Scrolling Integration with Lenis | UI / Animation | `apps/web/src/App.tsx`, `package.json` | ✅ Completed |

---

## 🛠 Summary of Implemented Solutions

### 1. Navbar Profile Picture Constraint
- Enforced fixed dimensions: `w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/[0.12]`.

### 2. Remove Supabase Cloud Note Banner
- Stripped debug dev badge from the home screen for a seamless, production-ready feel.

### 3. Sleek Nocturne Custom Select / Dropdowns
- Created `CustomSelect.tsx` with Nocturne surfaces (`#0E1015`, hairline borders `white/[0.08]`, smooth chevron animation, keyboard friendly). Replaced native dropdowns in `CreateSlotModal.tsx` and `ProfileView.tsx`.

### 4. Custom Modern Alert & Confirmation Modal
- Created `AlertContext.tsx` with promise-based `showAlert()` and `showConfirm()`. Replaced 100% of native browser alerts and confirms across the entire codebase (`App.tsx`, `SlotApplicantsModal.tsx`, `MySessionsView.tsx`, `OnboardingModal.tsx`, `RequestMockModal.tsx`).

### 5. Candidate Profile Inspection Modal
- Built `ApplicantProfileModal.tsx` with full profile credentials, target companies, verified skills tags, reliability history, bio, and direct LinkedIn/GitHub profile links.

### 6. Reject Application with Note & Email
- Implemented "Decline Candidate" dialog in `SlotApplicantsModal.tsx` with quick note templates + custom note input.
- Added `rejectRequestMutation` in `useSlots.ts`.
- Integrated `sendMockRejectedEmail` via Cloudflare Worker and Resend API.

### 7. Streamlined Post-Session Feedback & Profile Calibration Modal
- Redesigned `ReviewModal.tsx` with informative calibration notice explaining why mutual feedback is essential for profile reliability and platform integrity.
- Added 1-click quick feedback tag recommendations for rapid, high-signal reviews.
- Immediately updates participant metrics and session review in the database.

### 8. Resend Email Dispatch Architecture
- Enriched `Profile` in `useAuth.ts` to capture and preserve `authUser.email`.
- Updated worker endpoint to support `mock_request_declined` templates and default sender `PeerMock <onboarding@resend.dev>` for guaranteed deliverability.
- Re-deployed Cloudflare Worker live to production.

### 9. Notification Popover Click-to-Redirect
- Clicking notifications in `NotificationPopover.tsx` marks as read and smoothly redirects the user to the target tab (`marketplace`, `my-sessions`, or `profile`) and target slot.

### 10. Real-Time Peer Presence Engine
- Created `PresenceContext.tsx` leveraging Supabase Realtime channel `room:online-presence` with client session tracking.
- Live online peer count dynamically displayed in `Navbar.tsx` with pulsing green dot.
- Dynamic online presence indicators (`#34D399` green when online, `#61666F` muted gray when offline) on `SlotCard.tsx` and `SlotRow.tsx`.

### 11. Dynamic Banner Metrics Calculation
- Computed `mocksThisWeek` (completed sessions in past 7 days), `slotsOpenToday` (active open slots for today), and `medianTimeToMatch` (time to candidate match) dynamically from database queries in `MarketplaceView.tsx`.

### 12. Lenis Smooth Scrolling
- Integrated `@studio-freight/lenis` with standard `requestAnimationFrame` loop in `App.tsx` for fluid scrolling.
