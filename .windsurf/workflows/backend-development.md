---
description: How to develop backend APIs for the Plindo admin panel
auto_execution_mode: 3
---

# Plindo Backend Development Workflow

This workflow describes how to build the backend for the Plindo admin panel. The backend serves two user flows: **Admin** (administrator) and **Partner** (Plindo Partners). All API design is derived from the frontend's mock service worker (MSW) handlers in `client/src/_mock/handlers/`.

## Prerequisites

- Read the full backend plan at `.verdent/backend-plan.md`
- Backend lives in `/backend/` directory
- Stack: Node.js + Express + MongoDB + JWT + Multer + Nodemailer
- Package manager: `bun` (use `bun install`, `bun add`, `bun run dev`)

---

## Step 1: Research Frontend Mock Services

Before writing any backend code, deeply study these files to understand every API endpoint, request/response shape, and data model:

1. Read `client/src/_mock/index.ts` — lists all handler imports
2. Read every handler file in `client/src/_mock/handlers/`:
   - `_unified-auth.ts` — Unified sign-in (admin + partner)
   - `_user.ts` — Admin user sign-in + user list
   - `_partner-auth.ts` — Partner registration, application status, login
   - `_partners.ts` — Partner management (approve/reject/suspend/reactivate)
   - `_dashboard.ts` — Dashboard stats and trends
   - `_bookings.ts` — Legacy booking management
   - `_slot-bookings.ts` — New capacity-based slot booking system (1330 lines, most complex)
   - `_customers.ts` — Customer management
   - `_finance.ts` — Revenue, payouts, commissions
   - `_settings.ts` — Platform settings
   - `_legal.ts` — Legal docs + FAQs
   - `_logs.ts` — Activity/error/payment logs
   - `_partner-services.ts` — Partner's car wash services CRUD
   - `_partner-schedule.ts` — Calendar bookings + availability
   - `_partner-earnings.ts` — Partner earnings + transactions
   - `_partner-reviews.ts` — Reviews + partner responses
   - `_partner-messages.ts` — Conversations + messaging
   - `_partner-drivers.ts` — Driver management
   - `_partner-settings.ts` — Partner account settings
   - `_products.ts` — Partner products CRUD
   - `_product-orders.ts` — Product order management
   - `_cars.ts` — Car make/model/body type registry
3. Read `client/src/types/` — TypeScript types: `entity.ts`, `enum.ts`, `booking.ts`, `partner.ts`, `product.ts`
4. Read `client/src/api/apiClient.ts` — Axios client, response interceptor expects `{ status: 0, data: ... }`
5. Read `client/src/api/services/authService.ts` — Auth API contract
6. Read `client/src/store/authStore.ts` — How frontend stores auth state

**Key insight:** The frontend response interceptor in `apiClient.ts` checks `res.data.status === 0` for success. Every backend response MUST use this format:

```json
{
  "status": 0,
  "message": "",
  "data": { ... }
}
```

Error responses use non-zero status codes in the body (e.g., `status: -1`, `status: 10001`).

---

## Step 2: Set Up Backend Foundation

### 2a. Install Dependencies

```bash
cd backend
bun add express mongoose dotenv cors helmet morgan bcryptjs jsonwebtoken express-validator multer nodemailer uuid
bun add -d nodemon
```

### 2b. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT protect + authorize (admin/partner)
│   │   ├── errorHandler.js      # Global error handler
│   │   ├── upload.middleware.js  # Multer config for image uploads
│   │   └── validate.middleware.js # express-validator wrapper
│   ├── utils/
│   │   ├── response.js          # success() and error() response helpers
│   │   ├── pagination.js        # buildPagination(query, total) helper
│   │   └── email.js             # Nodemailer + SendGrid SMTP helper
│   ├── models/
│   │   ├── User.model.js        # Admin users
│   │   ├── Partner.model.js     # Partner accounts + applications
│   │   ├── Customer.model.js    # Customers
│   │   ├── Booking.model.js     # Slot-based bookings
│   │   ├── Service.model.js     # Partner services
│   │   ├── Product.model.js     # Partner products
│   │   ├── ProductOrder.model.js
│   │   ├── Driver.model.js      # Partner drivers
│   │   ├── Review.model.js      # Customer reviews
│   │   ├── Conversation.model.js # Messages
│   │   ├── Message.model.js
│   │   ├── Car.model.js         # Make/model/body type registry
│   │   ├── Settings.model.js    # Platform settings (singleton)
│   │   ├── LegalContent.model.js
│   │   ├── FAQ.model.js
│   │   └── ActivityLog.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── partner.controller.js    # Admin partner management
│   │   ├── customer.controller.js
│   │   ├── booking.controller.js    # Shared admin + partner bookings
│   │   ├── finance.controller.js
│   │   ├── settings.controller.js   # Admin platform settings
│   │   ├── legal.controller.js
│   │   ├── log.controller.js
│   │   ├── car.controller.js
│   │   ├── upload.controller.js
│   │   └── partner/                 # Partner portal controllers
│   │       ├── service.controller.js
│   │       ├── schedule.controller.js
│   │       ├── earning.controller.js
│   │       ├── review.controller.js
│   │       ├── message.controller.js
│   │       ├── driver.controller.js
│   │       ├── product.controller.js
│   │       ├── productOrder.controller.js
│   │       └── settings.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── partner.routes.js
│   │   ├── customer.routes.js
│   │   ├── booking.routes.js
│   │   ├── finance.routes.js
│   │   ├── settings.routes.js
│   │   ├── legal.routes.js
│   │   ├── log.routes.js
│   │   ├── car.routes.js
│   │   ├── upload.routes.js
│   │   ├── subscription.routes.js
│   │   ├── service.routes.js
│   │   └── partner/
│   │       ├── index.js             # Aggregates all partner sub-routes
│   │       ├── service.routes.js
│   │       ├── schedule.routes.js
│   │       ├── earning.routes.js
│   │       ├── review.routes.js
│   │       ├── message.routes.js
│   │       ├── driver.routes.js
│   │       ├── product.routes.js
│   │       ├── productOrder.routes.js
│   │       └── settings.routes.js
│   ├── seeds/
│   │   └── seed.js                  # Create default admin + demo data
│   └── server.js                    # Express app entry point
├── uploads/                         # Local image storage directory
├── .env
├── .env.example
└── package.json
```

### 2c. Environment Variables (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/plindo-admin
JWT_SECRET=plindo-super-secret-jwt-key-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=plindo-refresh-secret-key-2024
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
BASE_URL=http://localhost:5000
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key_here
EMAIL_FROM=assetguard@codecoytechnologies.live
```

### 2d. Response Helper (CRITICAL)

Create `src/utils/response.js`:

```js
export const success = (res, data = {}, message = "", statusCode = 200) => {
  return res.status(statusCode).json({
    status: 0,
    message,
    data,
  });
};

export const error = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errorCode = -1,
) => {
  return res.status(statusCode).json({
    status: errorCode,
    message,
  });
};
```

### 2e. Pagination Helper

Create `src/utils/pagination.js`:

```js
export const paginate = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginatedResponse = (items, total, page, limit) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
```

---

## Step 3: Build Models

Create Mongoose models matching the frontend types. Key rules:

- Use `timestamps: true` on all schemas
- Password fields: `select: false`
- Add indexes on fields used for filtering (email, status, partnerId)
- Partner model: includes both application data AND account data
- Settings model: singleton pattern using `findOneAndUpdate` with `upsert: true`
- Refer to `.verdent/backend-plan.md` for full field lists per model

---

## Step 4: Build Auth System

The auth system must support unified sign-in for both admin and partner accounts.

### Unified Sign-In Logic (`POST /api/auth/unified-signin`):

1. Receive `{ email, password }`
2. First, check if email matches an admin User → if yes, verify password, return admin response
3. If not admin, check if email matches a Partner → if yes, verify password, return partner response
4. If neither, return 401 "Invalid credentials"

### Admin response format:

```json
{
  "status": 0,
  "data": {
    "user": { "id", "username", "email", "avatar", "roles", "permissions" },
    "accessToken": "...",
    "refreshToken": "...",
    "role": "admin"
  }
}
```

### Partner response format:

```json
{
  "status": 0,
  "data": {
    "partner": { "id", "businessName", "email", "status", "avatar" },
    "accessToken": "...",
    "refreshToken": "...",
    "role": "partner"
  }
}
```

### Auth Middleware:

- `protect` — verifies JWT, attaches `req.user` (with `role` field)
- `authorize(...roles)` — checks `req.user.role` against allowed roles
- For partner routes, extract `partnerId` from JWT payload, NOT from query params

---

## Step 5: Build API Controllers (Phase by Phase)

Work through these in order. For each controller:

1. Read the corresponding MSW handler file to understand exact request/response shapes
2. Implement the controller with proper validation, error handling
3. Use `success()` and `error()` response helpers everywhere
4. Add pagination to ALL list endpoints using the pagination helper
5. Create the route file and register it in `server.js`

### Phase A: Admin APIs

Order: dashboard → partners → customers → bookings → finance → settings → legal → logs → cars

### Phase B: Partner APIs

Order: services → schedule/availability → bookings → earnings → reviews → messages → drivers → products → product-orders → settings

### Phase C: Shared APIs

Order: upload → subscriptions → services (public list)

---

## Step 6: Build Image Upload API

`POST /api/upload` — Global image upload endpoint

- Use Multer with disk storage to `uploads/` directory
- Accept single file field named `file`
- Generate unique filename with UUID
- Return full URL: `${BASE_URL}/uploads/${filename}`
- Serve static files: `app.use('/uploads', express.static('uploads'))`
- Accepted types: jpg, jpeg, png, gif, webp
- Max size: 5MB

---

## Step 7: Create Seed Script

Create `src/seeds/seed.js` that:

1. Connects to MongoDB
2. Drops existing collections (dev only)
3. Creates default admin: `{ username: "admin", email: "admin@plindo.com", password: "admin123", role: "admin" }`
4. Creates demo partner: `{ businessName: "Crystal Car Wash", email: "partner@plindo.com", password: "partner123", status: "active" }`
5. Creates default platform settings (commission rates, booking rules, etc.)
6. Creates sample car makes/models
7. Logs created credentials

Run with: `bun run seed`

---

## Step 8: Test APIs with cURL

After building each API group, test with cURL. Example pattern:

```bash
# Health check
curl http://localhost:5000/api/health

# Sign in as admin
curl -X POST http://localhost:5000/api/auth/unified-signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plindo.com","password":"admin123"}'

# Use token for protected routes
TOKEN="<paste_token_here>"

# Dashboard stats
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# List partners with pagination
curl "http://localhost:5000/api/partners?status=active&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Verify:

- Response format: `{ status: 0, message: "", data: { ... } }`
- Pagination format: `{ items: [...], total, page, limit, totalPages }`
- Error format: `{ status: -1 or 10001+, message: "..." }`
- Auth: 401 for missing/invalid tokens, 403 for wrong role

---

## Step 9: Integrate with Frontend

1. Update `client/src/global-config.ts` to set `apiBaseUrl` to `http://localhost:5000/api`
2. Update `client/src/api/apiClient.ts`:
   - Set proper `Authorization` header from auth store tokens
   - Handle 401 responses (clear auth, redirect to login)
3. Disable MSW in development:
   - In `client/src/main.tsx`, conditionally skip MSW setup
   - Or set an env variable like `VITE_USE_MOCK=false`
4. Test each page end-to-end:
   - Admin login → dashboard → partners → bookings → etc.
   - Partner login → services → schedule → earnings → etc.

---

## Important Rules

1. **NEVER duplicate API endpoints** — consolidate similar endpoints into one with query params
2. **ALWAYS use the response helper** — `success(res, data, message)` and `error(res, message, statusCode)`
3. **ALWAYS add pagination** — every list endpoint must accept `page` and `limit` query params
4. **Match frontend exactly** — the response shape must match what the frontend API service expects
5. **Partner data scoping** — partner endpoints must filter by the partner's own ID from JWT, never trust query params for partner identity
6. **No unnecessary packages** — only add what's needed
7. **Clean code** — proper error handling, validation, no console.log in production
8. **Activity logging** — admin actions (approve partner, suspend user, etc.) should be logged to ActivityLog
