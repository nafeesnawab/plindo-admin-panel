# Plindo Backend Development Plan

## Source of Truth Priority

**CRITICAL:** This plan is derived from the actual frontend API service files in `client/src/api/services/`. These are the definitive source of truth for what endpoints the backend must implement.

The MSW mock handlers in `client/src/_mock/handlers/` are a **secondary reference only**. They may contain:

- Extra endpoints not connected to any frontend page
- Endpoints with different URL patterns than the actual service files
- Data shapes that differ from what the real service files expect

**Always verify against the frontend service files first. If a service file calls a URL, that URL must exist in the backend. If only an MSW handler covers it but no service file calls it, skip it.**

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

## API Routes (Consolidated - No Duplication)

### Auth `/api/auth`

| Method | Path                        | Description                   | Auth      |
| ------ | --------------------------- | ----------------------------- | --------- |
| POST   | /unified-signin             | Sign in (admin or partner)    | Public    |
| POST   | /partner/register           | Register partner application  | Public    |
| GET    | /partner/application-status | Check application status      | Public    |
| GET    | /partner/check-email        | Check email availability      | Public    |
| POST   | /refresh-token              | Refresh access token          | Public    |
| GET    | /me                         | Get current user/partner info | Protected |

### Dashboard `/api/dashboard` (Admin only)

| Method | Path                         | Description                                                                    |
| ------ | ---------------------------- | ------------------------------------------------------------------------------ |
| GET    | /stats                       | Platform stats (activeUsers, bookingsToday, revenueToday, pendingApplications) |
| GET    | /bookings-trend              | Bookings trend data (query: days)                                              |
| GET    | /revenue-trend               | Revenue trend data (query: days)                                               |
| GET    | /user-growth                 | User growth data                                                               |
| GET    | /recent-bookings             | Recent 10 bookings                                                             |
| GET    | /recent-partner-applications | Recent 5 partner apps                                                          |
| GET    | /recent-users                | Recent 5 users                                                                 |

### Partners `/api/partners` (Admin only)

| Method | Path            | Description                                                                    |
| ------ | --------------- | ------------------------------------------------------------------------------ |
| GET    | /               | List partners (query: status, page, limit, search, rating, location, verified) |
| GET    | /:id            | Partner details (includes reviews, earningsHistory)                            |
| POST   | /:id/approve    | Approve partner                                                                |
| POST   | /:id/reject     | Reject partner (body: reason)                                                  |
| POST   | /:id/suspend    | Suspend partner (body: reason)                                                 |
| POST   | /:id/reactivate | Reactivate partner                                                             |
| DELETE | /:id            | Remove partner                                                                 |

### Customers `/api/customers` (Admin only)

| Method | Path            | Description                                                           |
| ------ | --------------- | --------------------------------------------------------------------- |
| GET    | /               | List customers (query: page, limit, search, status, dateFrom, dateTo) |
| GET    | /:id            | Customer details (includes bookingHistory)                            |
| POST   | /:id/suspend    | Suspend customer (body: reason)                                       |
| POST   | /:id/reactivate | Reactivate customer                                                   |
| DELETE | /:id            | Delete customer                                                       |
| POST   | /:id/notify     | Send notification to customer                                         |

### Bookings `/api/bookings` (Admin + Partner)

| Method | Path                 | Description                                                                  |
| ------ | -------------------- | ---------------------------------------------------------------------------- |
| GET    | /                    | List all bookings (admin view, paginated + filtered)                         |
| GET    | /slots               | Get available time slots (query: partnerId, date, serviceCategory, duration) |
| POST   | /slot                | Create a new booking                                                         |
| GET    | /slot/:id            | Get booking details                                                          |
| GET    | /timeline            | Partner timeline view (query: partnerId, weekStart)                          |
| POST   | /:id/cancel          | Cancel booking                                                               |
| POST   | /:id/reschedule      | Reschedule booking                                                           |
| PATCH  | /:id/status          | Update booking status                                                        |
| PATCH  | /:id/step/advance    | Advance service step                                                         |
| POST   | /:id/refund          | Issue refund                                                                 |
| GET    | /disputes            | List disputed bookings                                                       |
| POST   | /:id/resolve-dispute | Resolve dispute                                                              |
| POST   | /calculate-price     | Price preview                                                                |

### Finance `/api/finance` (Admin only)

| Method | Path                   | Description                                            |
| ------ | ---------------------- | ------------------------------------------------------ |
| GET    | /revenue-overview      | Revenue overview (allTime, thisMonth, thisWeek, today) |
| GET    | /revenue-trend         | 12-month revenue trend                                 |
| GET    | /revenue-by-partner    | Top partners by revenue                                |
| GET    | /commissions           | Commission breakdown (query: period)                   |
| GET    | /payouts               | Partner payouts (query: page, limit, status)           |
| POST   | /payouts/:id/mark-paid | Mark payout as paid                                    |
| GET    | /subscriptions         | Subscription revenue data                              |

### Settings `/api/settings` (Admin only)

| Method  | Path                        | Description                  |
| ------- | --------------------------- | ---------------------------- |
| GET/PUT | /commission                 | Commission settings          |
| GET/PUT | /booking-rules              | Booking rules                |
| GET/PUT | /subscription-plans         | Subscription plans           |
| GET/PUT | /payment                    | Payment settings             |
| GET/PUT | /notifications              | Notification toggle settings |
| GET     | /notification-templates     | List templates               |
| PUT     | /notification-templates/:id | Update a template            |

### Legal `/api/legal` (Admin write, public read)

| Method   | Path             | Description                        |
| -------- | ---------------- | ---------------------------------- |
| GET/PUT  | /terms           | Current terms & conditions         |
| GET      | /terms/history   | Terms version history              |
| GET/PUT  | /privacy         | Current privacy policy             |
| GET      | /privacy/history | Privacy version history            |
| GET/PUT  | /refund          | Refund policy                      |
| GET/PUT  | /about           | About us                           |
| GET/POST | /faqs            | List/Create FAQs (query: category) |
| PUT      | /faqs/:id        | Update FAQ                         |
| DELETE   | /faqs/:id        | Delete FAQ                         |
| PUT      | /faqs/reorder    | Reorder FAQs                       |

### Logs `/api/logs` (Admin only)

| Method | Path        | Description                               |
| ------ | ----------- | ----------------------------------------- |
| GET    | /activity   | Activity logs (query: page, limit, admin) |
| GET    | /errors     | System errors (query: page, limit, level) |
| GET    | /payments   | Payment failures (query: page, limit)     |
| GET    | /api-errors | API errors (query: page, limit)           |

### Partner Portal `/api/partner` (Partner only)

#### Services

| Method | Path                    | Description             |
| ------ | ----------------------- | ----------------------- |
| GET    | /services               | List partner's services |
| POST   | /services               | Create service          |
| GET    | /services/:id           | Get service             |
| PUT    | /services/:id           | Update service          |
| DELETE | /services/:id           | Delete service          |
| PATCH  | /services/:id/status    | Toggle active/inactive  |
| POST   | /services/:id/duplicate | Duplicate service       |

#### Schedule & Availability

| Method | Path                            | Description                            |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | /calendar/bookings              | Calendar bookings (query: month, year) |
| GET    | /availability                   | Availability settings                  |
| PUT    | /availability                   | Save all settings                      |
| PUT    | /availability/working-hours     | Update working hours                   |
| POST   | /availability/blocked-dates     | Block a date                           |
| DELETE | /availability/blocked-dates/:id | Unblock a date                         |
| PUT    | /availability/capacity          | Update capacity                        |
| PUT    | /availability/radius            | Update service radius                  |
| GET    | /availability/weekly            | Weekly availability                    |
| PUT    | /availability/weekly            | Update weekly availability             |
| GET    | /capacity                       | Get capacity config                    |
| PUT    | /capacity                       | Update capacity config                 |

#### Bookings (Partner view)

| Method | Path                               | Description                                                                          |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | /bookings                          | Partner's bookings (query: startDate, endDate, status, serviceCategory, page, limit) |
| GET    | /bookings/timeline                 | Timeline view (query: weekStart)                                                     |
| POST   | /bookings/:bookingId/assign-driver | Assign driver to booking                                                             |

#### Earnings

| Method | Path                   | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| GET    | /earnings/overview     | Earnings summary                    |
| GET    | /earnings/transactions | Transaction list (paginated)        |
| GET    | /earnings/payouts      | Payout history                      |
| GET    | /earnings/chart        | Earnings chart data (query: period) |

#### Reviews

| Method | Path                 | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | /reviews             | List reviews (query: rating, search) |
| POST   | /reviews/:id/respond | Respond to review                    |
| DELETE | /reviews/:id/respond | Delete response                      |

#### Messages

| Method | Path                             | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | /messages/conversations          | List conversations (query: search) |
| GET    | /messages/conversations/:id      | Get conversation                   |
| POST   | /messages/conversations/:id/send | Send message                       |
| POST   | /messages/conversations/:id/read | Mark as read                       |

#### Drivers

| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | /drivers          | List drivers (query: status, search) |
| GET    | /drivers/active   | Active drivers only                  |
| GET    | /drivers/expiring | Expiring documents (query: days)     |
| POST   | /drivers          | Create driver                        |
| GET    | /drivers/:id      | Get driver                           |
| PUT    | /drivers/:id      | Update driver                        |
| DELETE | /drivers/:id      | Delete driver                        |

#### Products

| Method | Path                 | Description                                                  |
| ------ | -------------------- | ------------------------------------------------------------ |
| GET    | /products            | List products (query: page, limit, search, status, category) |
| POST   | /products            | Create product                                               |
| GET    | /products/:id        | Get product                                                  |
| PUT    | /products/:id        | Update product                                               |
| DELETE | /products/:id        | Delete product                                               |
| PATCH  | /products/:id/stock  | Update stock                                                 |
| PATCH  | /products/:id/toggle | Toggle availability                                          |

#### Product Orders

| Method | Path                       | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | /product-orders            | List orders (query: page, limit, status) |
| GET    | /product-orders/:id        | Get order details                        |
| PATCH  | /product-orders/:id/status | Update order status                      |
| POST   | /product-orders/:id/cancel | Cancel order                             |

#### Settings

| Method | Path               | Description             |
| ------ | ------------------ | ----------------------- |
| GET    | /settings          | Get partner settings    |
| PUT    | /settings          | Update partner settings |
| POST   | /settings/password | Change password         |

### Cars `/api/admin/cars` (Admin only)

| Method | Path          | Description                                          |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | /             | List all cars (query: make, model, bodyType, search) |
| POST   | /             | Create car                                           |
| GET    | /makes        | Get unique makes                                     |
| GET    | /body-types   | Get body types                                       |
| GET    | /grouped      | Cars grouped by make                                 |
| GET    | /models/:make | Models for a make                                    |
| GET    | /:id          | Get car                                              |
| PUT    | /:id          | Update car                                           |
| DELETE | /:id          | Delete car                                           |

### Subscriptions `/api/subscriptions`

| Method | Path   | Description            |
| ------ | ------ | ---------------------- |
| GET    | /plans | Get subscription plans |

### Services `/api/services`

| Method | Path | Description         |
| ------ | ---- | ------------------- |
| GET    | /    | Public service list |

### Upload `/api/upload` (Global)

| Method | Path | Description                                     |
| ------ | ---- | ----------------------------------------------- |
| POST   | /    | Upload image to local storage, returns full URL |

---

## Implementation Phases

### Phase 1: Foundation

- [x] Project structure, Express setup, MongoDB connection
- [ ] Response helper (match frontend format: status 0/error codes)
- [ ] Pagination helper
- [ ] Auth middleware (JWT with dual role support: admin + partner)
- [ ] Error handling middleware
- [ ] Image upload middleware (Multer → local storage)
- [ ] Email service (Nodemailer + SendGrid SMTP)
- [ ] Seed script (create default admin + demo partner)

### Phase 2: Auth & Users

- [ ] User model (admin)
- [ ] Partner model
- [ ] Unified sign-in endpoint
- [ ] Partner registration (multipart form)
- [ ] Application status check
- [ ] Token refresh
- [ ] Password hashing (bcrypt)

### Phase 3: Admin APIs

- [ ] Dashboard stats (aggregation queries)
- [ ] Partners CRUD + approve/reject/suspend/reactivate
- [ ] Customers CRUD + suspend/reactivate/notify
- [ ] Bookings list + cancel/refund/disputes
- [ ] Finance (revenue overview, trends, payouts, commissions)
- [ ] Settings (commission, booking rules, subscriptions, payment, notifications)
- [ ] Legal (terms, privacy, refund, about, FAQs with versioning)
- [ ] Logs (activity, errors, payments, api-errors)
- [ ] Cars CRUD (make/model/bodyType registry)

### Phase 4: Partner APIs

- [ ] Partner services CRUD
- [ ] Schedule/availability management
- [ ] Slot booking system (capacity-aware)
- [ ] Earnings & transactions
- [ ] Reviews + responses
- [ ] Messages/conversations
- [ ] Drivers CRUD
- [ ] Products CRUD + stock management
- [ ] Product orders management
- [ ] Partner settings + password change

### Phase 5: Testing & Integration

- [ ] Test all endpoints with cURL
- [ ] Fix response format mismatches
- [ ] Update frontend API client baseURL
- [ ] Remove MSW handlers, point to real backend
- [ ] End-to-end flow testing

---

## Key Design Decisions

1. **Response format matches frontend exactly** — `{ status: 0, message: "", data: {} }`
2. **Single unified auth endpoint** — tries admin first, then partner
3. **Pagination on all list endpoints** — `{ items, total, page, limit, totalPages }`
4. **Image upload → local storage** — `/uploads/` directory, returns full URL
5. **No extra endpoints** — only what frontend actually calls
6. **Partner data scoped by JWT** — partner endpoints auto-filter by `req.user.partnerId`
7. **Admin role-based access** — `authorize('admin')` middleware on admin-only routes
8. **Activity logging** — auto-log admin actions to ActivityLog collection
