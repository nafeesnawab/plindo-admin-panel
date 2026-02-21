# Plindo Backend Development Plan

## Source of Truth Priority

### Primary Source: Frontend UI Code

**CRITICAL:** The **frontend API service files** in `client/src/api/services/` are the **ONLY** source of truth for what endpoints the backend must implement.

### Secondary Reference: MSW Mock Handlers

The MSW mock handlers in `client/src/_mock/handlers/` are a **secondary reference only** for understanding response shapes. They may contain:

- Extra endpoints not connected to any frontend page
- Endpoints with different URL patterns than the actual service files
- Data shapes that differ from what the real service files expect

### Pages Using Local Mock Data (NO API calls yet)

The following partner portal pages use **local mock data in hooks** and do NOT have corresponding API service files. These features will need API service files created BEFORE backend implementation:

| Page             | Hook File                                      | Mock Data Source                                  |
| ---------------- | ---------------------------------------------- | ------------------------------------------------- |
| Partner Earnings | `pages/partner/earnings/hooks/use-earnings.ts` | `mockEarnings`, `mockPayouts`, `mockTransactions` |
| Partner Reviews  | `pages/partner/reviews/hooks/use-reviews.ts`   | `mockReviews`                                     |
| Partner Messages | `pages/partner/messages/hooks/use-messages.ts` | `mockConversations`                               |
| Partner Drivers  | `pages/partner/drivers/hooks/use-drivers.ts`   | `MOCK_DRIVERS`                                    |
| Partner Settings | `pages/partner/settings/hooks/use-settings.ts` | `defaultSettings` (local state)                   |

**Action Required:** Before implementing backend APIs for these features, first create frontend API service files, then update the hooks to use them.

### Development Rule

**If a frontend service file calls a URL → that URL MUST exist in the backend.**
**If only an MSW handler covers it but no service file calls it → SKIP IT.**

## Overview

**App:** Plindo - Car wash booking platform (Cyprus-based)
**Two User Flows:** Admin (administrator) + Partner (Plindo Partners)
**Stack:** Node.js, Express, MongoDB, JWT, Nodemailer (SendGrid), Multer (local image upload)

---

## Frontend Architecture Summary

### Response Format (must match everywhere)

```json
{
  "status": 0,       // 0 = success, -1 = error, 10001+ = specific errors
  "message": "",
  "data": { ... }
}
```

### Pagination Format (used on all list endpoints)

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Auth Flow

- Unified sign-in: POST `/api/auth/unified-signin` with `{ email, password }`
- Returns `role: "admin"` or `role: "partner"` with tokens + user/partner data
- Admin gets: `{ user, accessToken, refreshToken, role: "admin" }`
- Partner gets: `{ partner, accessToken, refreshToken, role: "partner" }`
- Frontend stores tokens in localStorage via Zustand (authStore)
- API client sends `Authorization: Bearer <token>` header

---

## MongoDB Models (14 total)

### 1. User (Admin accounts)

- username, email, password, role (admin/superadmin), avatar, isActive, permissions[], menu[]

### 2. Partner (Partner accounts + applications)

- ownerName, businessName, email, password, phone, location, address
- status: pending | active | suspended
- services[], rating, totalBookings, completionRate, totalEarnings
- isVerified, businessLicense, workingHours, photos[], documents[]
- suspensionReason, suspendedAt, appliedAt
- businessRegistration, businessInsurance, motorTradeInsurance (file URLs)
- logo, coverPhoto, workPhotos[], description, serviceRadius
- latitude, longitude

### 3. Customer

- name, email, phone, avatar, location, status (active/suspended)
- totalBookings, totalSpent, vehicles[], subscription, paymentMethods[]
- suspensionReason, suspendedAt

### 4. Booking (Slot-based)

- bookingNumber, customer (ref), partner (ref), vehicle (embedded)
- service (embedded: id, name, serviceType, serviceCategory, basePrice, duration)
- slot (date, startTime, endTime), pricing (embedded), status
- serviceSteps[], bayId, bayName, productOrder (embedded)
- cancellation info, reschedule info, rating, notes

### 5. Service (Partner's services)

- partnerId, name, description, serviceCategory, serviceType
- duration, bannerUrl, bodyTypePricing[], carOverrides[]
- distanceCharges, status (active/inactive)

### 6. Product (Partner's products)

- partnerId, name, description, category, price, stock, imageUrl, status

### 7. ProductOrder

- orderNumber, bookingId, bookingRef, serviceName
- customerId, customerName, customerPhone, partnerId
- products[], totalAmount, status, orderDate, pickupDate

### 8. Driver

- partnerId, fullName, phone, email, licenseNumber
- licenseUrl, licenseExpiry, insuranceUrl, insuranceExpiry
- photoUrl, status (active/inactive)

### 9. Review

- partnerId, customerId, customerName, isAnonymous
- rating, reviewText, bookingId, service
- partnerResponse (text, date)

### 10. Conversation + Message

- Conversation: partnerId, customerId, customerName, lastMessage, lastMessageTime, unreadCount
- Message: conversationId, senderId, text, timestamp, read

### 11. Car (Make/Model registry)

- make, model, bodyType

### 12. Settings (Singleton)

- commission (customerCommission, partnerCommission)
- bookingRules (minAdvanceBookingHours, maxAdvanceBookingDays, cancellationWindowHours)
- subscriptionPlans (basic, premium with features)
- payment (stripeConnected, paymentMethods, payoutSchedule)
- notifications (types toggles)
- notificationTemplates[]

### 13. LegalContent

- type: terms | privacy | refund | about
- content (HTML), version, isActive, publishedBy, publishedAt
- For about: companyName, tagline, email, phone, address, socialLinks

### 14. FAQ

- question, answer (HTML), category, order, isActive

### 15. ActivityLog

- adminId, adminName, action, targetType, targetId, details, ipAddress, timestamp

---

## API Routes - Based on Frontend Service Files

**IMPORTANT:** Only implement endpoints that are called from `client/src/api/services/*.ts` files.

---

### Auth `/api/auth` (from `authService.ts`, `userService.ts`, `partnerAuthService.ts`)

| Method | Path            | Description                | Service File     |
| ------ | --------------- | -------------------------- | ---------------- |
| POST   | /unified-signin | Sign in (admin or partner) | `authService.ts` |
| POST   | /signin         | Admin sign in (legacy)     | `userService.ts` |
| POST   | /signup         | Admin sign up              | `userService.ts` |
| GET    | /logout         | Logout                     | `userService.ts` |
| POST   | /refresh        | Refresh token              | `userService.ts` |

### Partner Auth `/api/partner` (from `partnerAuthService.ts`)

| Method | Path                | Description                  | Service File            |
| ------ | ------------------- | ---------------------------- | ----------------------- |
| POST   | /register           | Register partner application | `partnerAuthService.ts` |
| GET    | /application-status | Check application status     | `partnerAuthService.ts` |
| POST   | /login              | Partner login                | `partnerAuthService.ts` |
| GET    | /check-email        | Check email availability     | `partnerAuthService.ts` |

### User `/api/user` (from `userService.ts`)

| Method | Path | Description    | Service File     |
| ------ | ---- | -------------- | ---------------- |
| GET    | /:id | Get user by ID | `userService.ts` |

### Menu `/api/menu` (from `menuService.ts`)

| Method | Path | Description   | Service File     |
| ------ | ---- | ------------- | ---------------- |
| GET    | /    | Get menu list | `menuService.ts` |

### Dashboard `/api/dashboard` (from `dashboardService.ts`)

| Method | Path                         | Description           | Service File          |
| ------ | ---------------------------- | --------------------- | --------------------- |
| GET    | /stats                       | Platform stats        | `dashboardService.ts` |
| GET    | /bookings-trend              | Bookings trend (days) | `dashboardService.ts` |
| GET    | /revenue-trend               | Revenue trend (days)  | `dashboardService.ts` |
| GET    | /user-growth                 | User growth data      | `dashboardService.ts` |
| GET    | /recent-bookings             | Recent 10 bookings    | `dashboardService.ts` |
| GET    | /recent-partner-applications | Recent 5 partner apps | `dashboardService.ts` |
| GET    | /recent-users                | Recent 5 users        | `dashboardService.ts` |

### Partners `/api/partners` (from `partnerService.ts`)

| Method | Path            | Description                    | Service File        |
| ------ | --------------- | ------------------------------ | ------------------- |
| GET    | /pending        | List pending partners          | `partnerService.ts` |
| GET    | /active         | List active partners           | `partnerService.ts` |
| GET    | /suspended      | List suspended partners        | `partnerService.ts` |
| GET    | /:id            | Partner details                | `partnerService.ts` |
| POST   | /:id/approve    | Approve partner                | `partnerService.ts` |
| POST   | /:id/reject     | Reject partner (body: reason)  | `partnerService.ts` |
| POST   | /:id/suspend    | Suspend partner (body: reason) | `partnerService.ts` |
| POST   | /:id/reactivate | Reactivate partner             | `partnerService.ts` |
| DELETE | /:id            | Remove partner                 | `partnerService.ts` |

### Customers `/api/customers` (from `customerService.ts`)

| Method | Path            | Description                | Service File         |
| ------ | --------------- | -------------------------- | -------------------- |
| GET    | /               | List customers (paginated) | `customerService.ts` |
| GET    | /:id            | Customer details           | `customerService.ts` |
| POST   | /:id/suspend    | Suspend customer           | `customerService.ts` |
| POST   | /:id/reactivate | Reactivate customer        | `customerService.ts` |
| DELETE | /:id            | Delete customer            | `customerService.ts` |
| POST   | /:id/notify     | Send notification          | `customerService.ts` |

### Bookings `/api/bookings` (from `bookingService.ts`, `slotBookingService.ts`)

| Method | Path                 | Description              | Service File            |
| ------ | -------------------- | ------------------------ | ----------------------- |
| GET    | /                    | List bookings (admin)    | `bookingService.ts`     |
| GET    | /:id                 | Booking details          | `bookingService.ts`     |
| POST   | /:id/cancel          | Cancel booking           | `bookingService.ts`     |
| POST   | /:id/refund          | Issue refund             | `bookingService.ts`     |
| GET    | /disputes            | List disputed bookings   | `bookingService.ts`     |
| POST   | /:id/resolve-dispute | Resolve dispute          | `bookingService.ts`     |
| GET    | /slots               | Get available slots      | `slotBookingService.ts` |
| POST   | /slot                | Create booking           | `slotBookingService.ts` |
| GET    | /slot/:id            | Get slot booking details | `slotBookingService.ts` |
| POST   | /:id/reschedule      | Reschedule booking       | `slotBookingService.ts` |
| PATCH  | /:id/status          | Update booking status    | `slotBookingService.ts` |
| PATCH  | /:id/step/advance    | Advance service step     | `slotBookingService.ts` |
| POST   | /calculate-price     | Calculate price          | `slotBookingService.ts` |

### Admin Bookings `/api/admin/bookings` (from `slotBookingService.ts`)

| Method | Path | Description                | Service File            |
| ------ | ---- | -------------------------- | ----------------------- |
| GET    | /    | Admin bookings (paginated) | `slotBookingService.ts` |

### Finance `/api/finance` (from `financeService.ts`)

| Method | Path                   | Description             | Service File        |
| ------ | ---------------------- | ----------------------- | ------------------- |
| GET    | /revenue-overview      | Revenue overview        | `financeService.ts` |
| GET    | /revenue-trend         | 12-month revenue trend  | `financeService.ts` |
| GET    | /revenue-by-partner    | Top partners by revenue | `financeService.ts` |
| GET    | /commissions           | Commission breakdown    | `financeService.ts` |
| GET    | /payouts               | Partner payouts         | `financeService.ts` |
| POST   | /payouts/:id/mark-paid | Mark payout as paid     | `financeService.ts` |
| GET    | /subscriptions         | Subscription revenue    | `financeService.ts` |

### Settings `/api/settings` (from `settingsService.ts`)

| Method | Path                        | Description               | Service File         |
| ------ | --------------------------- | ------------------------- | -------------------- |
| GET    | /commission                 | Get commission settings   | `settingsService.ts` |
| PUT    | /commission                 | Update commission         | `settingsService.ts` |
| GET    | /booking-rules              | Get booking rules         | `settingsService.ts` |
| PUT    | /booking-rules              | Update booking rules      | `settingsService.ts` |
| GET    | /subscription-plans         | Get subscription plans    | `settingsService.ts` |
| PUT    | /subscription-plans         | Update subscription plans | `settingsService.ts` |
| GET    | /payment                    | Get payment settings      | `settingsService.ts` |
| PUT    | /payment                    | Update payment settings   | `settingsService.ts` |
| GET    | /notifications              | Get notification settings | `settingsService.ts` |
| PUT    | /notifications              | Update notifications      | `settingsService.ts` |
| GET    | /notification-templates     | List templates            | `settingsService.ts` |
| PUT    | /notification-templates/:id | Update template           | `settingsService.ts` |

### Legal `/api/legal` (from `legalService.ts`)

| Method | Path             | Description             | Service File      |
| ------ | ---------------- | ----------------------- | ----------------- |
| GET    | /terms           | Get terms & conditions  | `legalService.ts` |
| PUT    | /terms           | Update terms            | `legalService.ts` |
| GET    | /terms/history   | Terms version history   | `legalService.ts` |
| GET    | /privacy         | Get privacy policy      | `legalService.ts` |
| PUT    | /privacy         | Update privacy policy   | `legalService.ts` |
| GET    | /privacy/history | Privacy version history | `legalService.ts` |
| GET    | /refund          | Get refund policy       | `legalService.ts` |
| PUT    | /refund          | Update refund policy    | `legalService.ts` |
| GET    | /about           | Get about us            | `legalService.ts` |
| PUT    | /about           | Update about us         | `legalService.ts` |
| GET    | /faqs            | List FAQs               | `legalService.ts` |
| POST   | /faqs            | Create FAQ              | `legalService.ts` |
| PUT    | /faqs/:id        | Update FAQ              | `legalService.ts` |
| DELETE | /faqs/:id        | Delete FAQ              | `legalService.ts` |
| PUT    | /faqs/reorder    | Reorder FAQs            | `legalService.ts` |

### Logs `/api/logs` (from `logsService.ts`)

| Method | Path      | Description      | Service File     |
| ------ | --------- | ---------------- | ---------------- |
| GET    | /activity | Activity logs    | `logsService.ts` |
| GET    | /errors   | System errors    | `logsService.ts` |
| GET    | /payments | Payment failures | `logsService.ts` |
| GET    | /api      | API errors       | `logsService.ts` |

### Analytics `/api/analytics` (from `analyticsService.ts`)

| Method | Path           | Description            | Service File          |
| ------ | -------------- | ---------------------- | --------------------- |
| GET    | /users         | User analytics         | `analyticsService.ts` |
| GET    | /bookings      | Booking analytics      | `analyticsService.ts` |
| GET    | /partners      | Partner analytics      | `analyticsService.ts` |
| GET    | /subscriptions | Subscription analytics | `analyticsService.ts` |

### Notifications `/api/notifications` (from `notificationService.ts`)

| Method | Path     | Description          | Service File             |
| ------ | -------- | -------------------- | ------------------------ |
| POST   | /send    | Send notification    | `notificationService.ts` |
| GET    | /history | Notification history | `notificationService.ts` |
| GET    | /:id     | Notification details | `notificationService.ts` |

### Support `/api/support` (from `supportService.ts`)

| Method | Path                | Description     | Service File        |
| ------ | ------------------- | --------------- | ------------------- |
| GET    | /tickets            | List tickets    | `supportService.ts` |
| GET    | /tickets/:id        | Ticket details  | `supportService.ts` |
| POST   | /tickets/:id/reply  | Reply to ticket | `supportService.ts` |
| POST   | /tickets/:id/assign | Assign ticket   | `supportService.ts` |
| POST   | /tickets/:id/close  | Close ticket    | `supportService.ts` |

### Partner Portal `/api/partner` (from various service files)

#### Services (from `partnerServicesService.ts`)

| Method | Path                    | Description             | Service File                |
| ------ | ----------------------- | ----------------------- | --------------------------- |
| GET    | /services               | List partner's services | `partnerServicesService.ts` |
| POST   | /services               | Create service          | `partnerServicesService.ts` |
| GET    | /services/:id           | Get service             | `partnerServicesService.ts` |
| PUT    | /services/:id           | Update service          | `partnerServicesService.ts` |
| DELETE | /services/:id           | Delete service          | `partnerServicesService.ts` |
| PATCH  | /services/:id/status    | Toggle status           | `partnerServicesService.ts` |
| POST   | /services/:id/duplicate | Duplicate service       | `partnerServicesService.ts` |

#### Availability & Capacity (from `slotBookingService.ts`)

| Method | Path                 | Description            | Service File            |
| ------ | -------------------- | ---------------------- | ----------------------- |
| GET    | /availability/weekly | Weekly availability    | `slotBookingService.ts` |
| PUT    | /availability/weekly | Update weekly avail    | `slotBookingService.ts` |
| GET    | /capacity            | Get capacity config    | `slotBookingService.ts` |
| PUT    | /capacity            | Update capacity config | `slotBookingService.ts` |

#### Bookings (from `slotBookingService.ts`)

| Method | Path               | Description        | Service File            |
| ------ | ------------------ | ------------------ | ----------------------- |
| GET    | /bookings          | Partner's bookings | `slotBookingService.ts` |
| GET    | /bookings/timeline | Timeline view      | `slotBookingService.ts` |

#### Products (from `productService.ts`)

| Method | Path                 | Description         | Service File        |
| ------ | -------------------- | ------------------- | ------------------- |
| GET    | /products            | List products       | `productService.ts` |
| POST   | /products            | Create product      | `productService.ts` |
| GET    | /products/:id        | Get product         | `productService.ts` |
| PUT    | /products/:id        | Update product      | `productService.ts` |
| DELETE | /products/:id        | Delete product      | `productService.ts` |
| PATCH  | /products/:id/stock  | Update stock        | `productService.ts` |
| PATCH  | /products/:id/toggle | Toggle availability | `productService.ts` |

#### Product Orders (from `productService.ts`)

| Method | Path                       | Description         | Service File        |
| ------ | -------------------------- | ------------------- | ------------------- |
| GET    | /product-orders            | List orders         | `productService.ts` |
| GET    | /product-orders/:id        | Order details       | `productService.ts` |
| PATCH  | /product-orders/:id/status | Update order status | `productService.ts` |
| POST   | /product-orders/:id/cancel | Cancel order        | `productService.ts` |

#### Earnings (from `earningsService.ts`)

| Method | Path                   | Description              | Service File         |
| ------ | ---------------------- | ------------------------ | -------------------- |
| GET    | /earnings/overview     | Earnings summary         | `earningsService.ts` |
| GET    | /earnings/transactions | Transactions (paginated) | `earningsService.ts` |
| GET    | /earnings/payouts      | Payout history           | `earningsService.ts` |
| GET    | /earnings/chart        | Chart data (period)      | `earningsService.ts` |

#### Reviews (from `reviewsService.ts`)

| Method | Path                 | Description       | Service File        |
| ------ | -------------------- | ----------------- | ------------------- |
| GET    | /reviews             | List reviews      | `reviewsService.ts` |
| POST   | /reviews/:id/respond | Respond to review | `reviewsService.ts` |
| DELETE | /reviews/:id/respond | Delete response   | `reviewsService.ts` |

#### Messages (from `messagesService.ts`)

| Method | Path                             | Description        | Service File         |
| ------ | -------------------------------- | ------------------ | -------------------- |
| GET    | /messages/conversations          | List conversations | `messagesService.ts` |
| GET    | /messages/conversations/:id      | Get conversation   | `messagesService.ts` |
| POST   | /messages/conversations/:id/send | Send message       | `messagesService.ts` |
| POST   | /messages/conversations/:id/read | Mark as read       | `messagesService.ts` |

#### Drivers (from `driversService.ts`)

| Method | Path              | Description         | Service File        |
| ------ | ----------------- | ------------------- | ------------------- |
| GET    | /drivers          | List drivers        | `driversService.ts` |
| GET    | /drivers/active   | Active drivers only | `driversService.ts` |
| GET    | /drivers/expiring | Expiring documents  | `driversService.ts` |
| POST   | /drivers          | Create driver       | `driversService.ts` |
| GET    | /drivers/:id      | Get driver          | `driversService.ts` |
| PUT    | /drivers/:id      | Update driver       | `driversService.ts` |
| DELETE | /drivers/:id      | Delete driver       | `driversService.ts` |

#### Settings (from `partnerSettingsService.ts`)

| Method | Path               | Description             | Service File                |
| ------ | ------------------ | ----------------------- | --------------------------- |
| GET    | /settings          | Get partner settings    | `partnerSettingsService.ts` |
| PUT    | /settings          | Update partner settings | `partnerSettingsService.ts` |
| POST   | /settings/password | Change password         | `partnerSettingsService.ts` |

### Cars Registry `/api/admin/cars` (from `carsService.ts`)

| Method | Path          | Description          | Service File     |
| ------ | ------------- | -------------------- | ---------------- |
| GET    | /             | List cars (filtered) | `carsService.ts` |
| POST   | /             | Create car           | `carsService.ts` |
| GET    | /makes        | Get unique makes     | `carsService.ts` |
| GET    | /body-types   | Get body types       | `carsService.ts` |
| GET    | /grouped      | Cars grouped by make | `carsService.ts` |
| GET    | /models/:make | Models for a make    | `carsService.ts` |
| GET    | /:id          | Get car by ID        | `carsService.ts` |
| PUT    | /:id          | Update car           | `carsService.ts` |
| DELETE | /:id          | Delete car           | `carsService.ts` |

### Services `/api/services` (from `slotBookingService.ts`)

| Method | Path | Description         | Service File            |
| ------ | ---- | ------------------- | ----------------------- |
| GET    | /    | Public service list | `slotBookingService.ts` |

### Subscriptions `/api/subscriptions` (from `slotBookingService.ts`)

| Method | Path   | Description            | Service File            |
| ------ | ------ | ---------------------- | ----------------------- |
| GET    | /plans | Get subscription plans | `slotBookingService.ts` |

### Upload `/api/upload` (Global - needed for image uploads)

| Method | Path | Description              | Notes                     |
| ------ | ---- | ------------------------ | ------------------------- |
| POST   | /    | Upload image, return URL | Used by multiple features |

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Project structure, Express setup, MongoDB connection
- [x] Response helper (match frontend format: status 0/error codes)
- [x] Pagination helper
- [x] Auth middleware (JWT with dual role support: admin + partner)
- [x] Error handling middleware
- [x] Image upload middleware (Multer → local storage)
- [x] Email service (Nodemailer + SendGrid SMTP)
- [x] Seed script (create default admin + demo partner)

### Phase 2: Auth & Core Models ✅ COMPLETE

- [x] User model (admin)
- [x] Partner model
- [x] Customer model + all 16 Mongoose models
- [x] Unified sign-in endpoint (`authService.ts`)
- [x] Partner registration (`partnerAuthService.ts`)
- [x] Application status check (`partnerAuthService.ts`)
- [x] Token refresh (`userService.ts`)
- [x] Menu endpoint (`menuService.ts`)

### Phase 3: Admin Dashboard & Management APIs ✅ COMPLETE

**From existing frontend service files:**

- [x] Dashboard stats & trends (`dashboardService.ts` - 7 endpoints)
- [x] Partners management (`partnerService.ts` - 9 endpoints)
- [x] Customers management (`customerService.ts` - 6 endpoints)
- [x] Analytics (`analyticsService.ts` - 4 endpoints)

### Phase 4: Bookings & Finance APIs ✅ COMPLETE

**From existing frontend service files:**

- [x] Bookings (`bookingService.ts` - 6 endpoints)
- [x] Slot bookings (`slotBookingService.ts` - 13 endpoints) — `slotBooking.controller.js`
- [x] Admin bookings (`slotBookingService.ts` - 1 endpoint) — `GET /api/admin/bookings`
- [x] Finance (`financeService.ts` - 7 endpoints)

### Phase 5: Settings & Content APIs ✅ COMPLETE

**From existing frontend service files:**

- [x] Settings (`settingsService.ts` - 12 endpoints)
- [x] Legal content (`legalService.ts` - 15 endpoints)
- [x] Logs (`logsService.ts` - 4 endpoints) — response format fixed: `{logs/errors/failures, pagination}`
- [x] Notifications (`notificationService.ts` - 3 endpoints) — `notification.controller.js`
- [x] Support tickets (`supportService.ts` - 5 endpoints)

### Phase 6: Partner Portal APIs ✅ COMPLETE

**All frontend service files now exist:**

- [x] Partner services (`partnerServicesService.ts` - 7 endpoints)
- [x] Partner availability/capacity (`slotBookingService.ts` - 4 endpoints) — `partner/schedule.controller.js`
- [x] Partner bookings (`slotBookingService.ts` - 2 endpoints) — `GET /partner/bookings` + `/timeline`
- [x] Partner products (`productService.ts` - 7 endpoints)
- [x] Partner product orders (`productService.ts` - 4 endpoints)
- [x] Partner earnings (`earningsService.ts` - 4 endpoints)
- [x] Partner reviews (`reviewsService.ts` - 3 endpoints)
- [x] Partner messages (`messagesService.ts` - 4 endpoints)
- [x] Partner drivers (`driversService.ts` - 7 endpoints)
- [x] Partner settings (`partnerSettingsService.ts` - 3 endpoints)

### Phase 7: Cars Registry & Admin Extras ✅ COMPLETE

- [x] Cars CRUD (`carsService.ts` - 9 endpoints)

### Phase 8: Testing & Integration ✅ COMPLETE — INTEGRATED

- [x] Start MongoDB + run seed script (`node src/seeds/seed.js`)
- [x] Create `.env` file from `.env.example`
- [x] Test all endpoints with cURL — **81 tests passing (45 read + 36 write)**
- [x] Fix response format mismatches (logs, auth aliases, partner auth prefix)
- [x] Implemented `slotBookingService.ts` endpoints (availability, capacity, bookings, slots, reschedule, status, step advance, calculate-price)
- [x] Implemented `notificationService.ts` endpoints
- [x] **DONE:** Updated `vite.config.ts` proxy → `http://localhost:5001` (no path rewrite needed since backend has `/api` prefix)
- [x] **DONE:** Fixed `apiClient.ts` — replaced hardcoded `"Bearer Token"` with real JWT from `authStore` (role-aware: admin vs partner token)
- [x] **DONE:** Disabled MSW in `client/src/main.tsx` (`USE_MOCK = false`)
- [x] **DONE:** Added `/status` alias route in `partner/service.routes.js` (frontend calls `/status`, backend had `/toggle`)
- [x] **DONE:** 62/62 read endpoint tests pass through Vite proxy (localhost:3001 → localhost:5001)

> **Server runs on port 5001** (port 5000 is taken by macOS AirPlay on dev machine). Use `PORT=5001 node src/server.js`.
> **Frontend runs on port 3001** via `npm run dev` in the `client/` directory.
> **Re-enable MSW**: set `USE_MOCK = true` in `client/src/main.tsx`.

---

## Key Design Decisions

1. **UI-first development** — Only implement endpoints called from `client/src/api/services/*.ts`
2. **Response format matches frontend exactly** — `{ status: 0, message: "", data: {} }`
3. **Single unified auth endpoint** — tries admin first, then partner
4. **Pagination on all list endpoints** — `{ items, total, page, limit, totalPages }`
5. **Image upload → local storage** — `/uploads/` directory, returns full URL
6. **No extra endpoints** — skip MSW handlers that have no corresponding service file
7. **Partner data scoped by JWT** — partner endpoints auto-filter by `req.user.partnerId`
8. **Admin role-based access** — `authorize('admin')` middleware on admin-only routes
9. **Activity logging** — auto-log admin actions to ActivityLog collection
10. **Frontend service files first** — for features using mock data, create service files before backend
