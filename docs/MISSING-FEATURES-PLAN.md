# PLINDO – Missing Pre-Launch Features Plan

> Based on: `PLINDO-App-Concept.md` + `CleanRide-Technical-Brief.md`
> Scope: Web App only (Admin Panel + Partner Portal)
> Excluded: Post-launch features (tipping, ads/advertising, AI recommendations, wallet, loyalty, fleet, multi-language, emergency wash, B2B expansion, weather suggestions)

---

## MSW Status

MSW (Mock Service Worker) is **already disabled** — `USE_MOCK = false` in `client/src/main.tsx`. All active pages call real backend endpoints. No action needed.

---

## Section A – Dead Code to Remove

These files exist but are not connected to anything.

### A1. Orphaned Frontend Page

**File:** `client/src/pages/dashboard/analysis/index.tsx`

- Not referenced in any route or nav
- Contains ~200 lines of hardcoded web analytics data (visitors, ad campaigns, top pages) irrelevant to PLINDO
- **Action:** Delete the file

### A2. Unmounted Backend Route File

**File:** `backend/src/routes/partner/messaging.routes.js`

- Never imported in `partner/index.js` or `server.js`
- `message.routes.js` (already mounted under `/messages`) handles all partner messaging correctly
- **Action:** Delete the file

---

## Section B – Missing Pre-Launch Features

---

## B1. 2-Minute Booking Accept/Reject Timer

**Source:** PLINDO-App-Concept.md – Business Rules

### Backend
- Add `acceptDeadline` (Date) field to `Booking.model.js`
- On booking creation: set `acceptDeadline = createdAt + 2 minutes`
- Background job (`node-cron`): every minute, query bookings where `status === 'pending'` AND `acceptDeadline < now` → auto-cancel, set `status = 'auto_cancelled'`, notify customer
- `GET /api/partner/bookings` — include `acceptDeadline` in each pending booking response

### Frontend (Partner Portal)
- **Bookings page** — show countdown timer on each pending booking card
- Auto-remove card when timer expires (poll every 30s or via existing Socket.io)
- Sound/visual alert when new booking arrives
- Booking card: prominent Accept / Decline buttons with timer

---

## B2. Cancellation Refund Logic (1st & 2nd = Auto, 3rd+ = Manual Review)

**Source:** PLINDO-App-Concept.md – Customer Features

### Backend
- Add `cancellationCount` (Number, default 0) to `Customer.model.js`
- On `POST /api/mobile/bookings/:id/cancel`:
  - Increment `customer.cancellationCount`
  - If count ≤ 2: auto-refund via Stripe immediately
  - If count > 2: create `RefundRequest` with `status: 'pending_review'`
- New model: **`RefundRequest.model.js`**
  ```
  bookingId, customerId, amount, reason,
  status (pending_review / approved / rejected),
  reviewedBy, reviewedAt, createdAt
  ```
- New routes:
  - `GET /api/admin/refund-requests` — list requests (pagination + filter by status, date range)
  - `POST /api/admin/refund-requests/:id/approve` — trigger Stripe refund + mark approved
  - `POST /api/admin/refund-requests/:id/reject` — mark rejected + notify customer

### Frontend (Admin)
- **New page: Finance > Refund Requests** (`/finance/refund-requests`)
  - Table: Customer name, Booking #, Amount, Reason, Cancellation # (e.g. "3rd"), Date, Status
  - Approve / Reject action buttons
  - Filter: status, date range
  - Badge on sidebar nav showing pending count

---

## B3. Partner Performance Auto-Monitoring

**Source:** CleanRide-Technical-Brief.md – Rating & Review System

### Backend
- On every review saved (via mobile), after updating `averageRating`:
  - If `averageRating < 3.5` AND `partner.hasWarning === false`: set `hasWarning = true`, notify admin + partner
  - If `averageRating < 3.0`: auto-set `partner.status = 'suspended'`, notify admin + partner
- Add to `Partner.model.js`:
  - `hasWarning` (Boolean, default false)
  - `completionRate` (Number) — recalculate on each status change: `completed / (confirmed + completed + cancelledByPartner)`
- `GET /api/admin/partners/:id` — include `averageRating`, `completionRate`, `totalReviews`, `hasWarning`

### Frontend (Admin)
- **Partners > Active list** — add Rating column: green ≥ 4.0 / yellow 3.5–3.9 (warning badge) / red < 3.5
- **Partner Detail page** — show `completionRate %` and `averageRating` prominently near header
- **Dashboard workbench** — add "At-Risk Partners" widget listing partners with `averageRating < 3.5`

---

## B4. PDF Invoice Generation (Partner)

**Source:** PLINDO-App-Concept.md – Advanced Features #3 (Automated Invoicing & Business Dashboard)

### Backend
- Install `pdfkit` npm package
- New routes:
  - `GET /api/partner/invoices` — list monthly summaries: `[{ month, totalBookings, grossRevenue, commissionPaid, netAmount }]`
  - `GET /api/partner/invoices/:month/download` — generate + stream PDF
    - PDF: partner business name, month/year, bookings table (date, service, amount, commission), totals, net payout
  - `GET /api/admin/invoices?partnerId=&month=` — admin audit view

### Frontend (Partner Portal)
- **Earnings page** — add "Invoices" tab
  - Table: Month, Total Bookings, Gross Revenue, Commission Paid, Net Amount, Download PDF button

### Frontend (Admin)
- **Finance > Payouts** — add download icon per row to fetch that partner's invoice PDF

---

## B5. Downloadable Reports (Admin)

**Source:** CleanRide-Technical-Brief.md – Admin Dashboard ("Generate reports")

### Backend
- New routes under `/api/admin/reports`:
  - `GET /api/admin/reports/bookings?from=&to=&format=csv`
  - `GET /api/admin/reports/finance?from=&to=&format=csv`
  - `GET /api/admin/reports/partners?from=&to=&format=csv`
  - `GET /api/admin/reports/customers?from=&to=&format=csv`
- Install `json2csv` for CSV streaming

### Frontend (Admin)
- **New page: Reports** (`/reports`)
  - 4 cards: Bookings, Finance, Partners, Customers
  - Each card: date range picker + Export CSV button

---

## B6. Partner Portfolio / Gallery

**Source:** PLINDO-App-Concept.md – Business Owner Features ("up to 10 images of their work")

### Backend
- Add `portfolioImages` (Array of Strings, max 10) to `Partner.model.js`
- New partner routes:
  - `POST /api/partner/settings/portfolio` — upload image (multipart), reject if already at 10
  - `DELETE /api/partner/settings/portfolio/:index` — remove by index
  - `PUT /api/partner/settings/portfolio/reorder` — save new order `{ images: [...urls] }`
- Mobile: `GET /api/mobile/partners/:id` — include `portfolioImages`

### Frontend (Partner Portal)
- **Settings page** — add "Portfolio / Gallery" section
  - Image grid: up to 10 slots, "+" card for empty slots
  - Hover each image: show delete button
  - Slot counter: "6 / 10 images"

---

## B7. Partner Packages & Deals

**Source:** PLINDO-App-Concept.md – Business Owner Features

### Backend
- New model: **`PartnerDeal.model.js`**
  ```
  partnerId, title, description,
  services (Array of serviceIds),
  originalPrice (Number, cents),
  discountedPrice (Number, cents),
  validUntil (Date),
  isMonthlyPackage (Boolean),
  isActive (Boolean),
  createdAt
  ```
- Partner routes:
  - `GET /api/partner/deals`
  - `POST /api/partner/deals`
  - `PUT /api/partner/deals/:id`
  - `DELETE /api/partner/deals/:id`
- Mobile: `GET /api/mobile/partners/:id/deals` — active deals for partner profile page

### Frontend (Partner Portal)
- **New page: Deals & Packages** (`/partner/deals`)
  - Active / Expired tabs
  - Create/Edit deal: title, description, select services, original price, deal price, valid until, monthly package toggle

---

## Implementation Priority

| Priority | Item | Effort |
|---|---|---|
| 🔴 Critical | A1 + A2: Delete dead code | Trivial |
| 🔴 Critical | B1: 2-Minute Booking Timer | Medium |
| 🔴 Critical | B2: Cancellation Refund Logic + Admin Queue | Medium |
| 🟠 High | B3: Partner Performance Auto-Monitoring | Low |
| 🟠 High | B4: PDF Invoice Generation | Medium |
| 🟡 Medium | B5: Downloadable Reports | Medium |
| 🟡 Medium | B6: Partner Portfolio/Gallery | Low |
| 🟡 Medium | B7: Packages & Deals | Medium |

---

## Summary of New Files

### Backend – New
- `src/models/RefundRequest.model.js`
- `src/models/PartnerDeal.model.js`
- `src/routes/admin/refundRequests.routes.js`
- `src/routes/admin/reports.routes.js`
- `src/routes/admin/invoices.routes.js`
- `src/routes/partner/deals.routes.js`
- `src/routes/partner/invoices.routes.js`
- `src/jobs/bookingTimeoutJob.js` (cron job, every minute)
- `src/utils/pdfGenerator.js`
- `src/utils/csvExporter.js`

### Backend – Delete
- `src/routes/partner/messaging.routes.js`

### Frontend – New
- `src/pages/finance/refund-requests/index.tsx`
- `src/pages/reports/index.tsx`
- `src/pages/partner/deals/index.tsx`

### Frontend – Delete
- `src/pages/dashboard/analysis/index.tsx`

### Modified Files
- `backend/src/models/Booking.model.js` — add `acceptDeadline`
- `backend/src/models/Customer.model.js` — add `cancellationCount`
- `backend/src/models/Partner.model.js` — add `portfolioImages`, `completionRate`, `hasWarning`
- `backend/src/routes/mobile.routes.js` — cancellation counter + auto-refund logic
- `backend/src/routes/partner/index.js` — mount deals + invoices routes
- `backend/src/server.js` — mount admin reports, invoices, refund-requests; start cron job
- `client/src/pages/partner/bookings/` — add countdown timer on pending bookings
- `client/src/pages/partner/earnings/` — add Invoices tab
- `client/src/pages/partner/settings/` — add Portfolio/Gallery section
- `client/src/pages/partners/details/` — show rating, completion rate, warning badge
- `client/src/pages/partners/active/` — add rating column with color coding
- `client/src/pages/dashboard/workbench/` — add At-Risk Partners widget
- `client/src/layouts/dashboard/nav/` — add Reports + Refund Requests to nav
