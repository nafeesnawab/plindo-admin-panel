---
description: How to develop backend APIs for the Plindo admin panel
auto_execution_mode: 3
---

# Plindo Backend Development Workflow

This workflow describes how to build the backend for the Plindo admin panel. The backend serves two user flows: **Admin** (administrator) and **Partner** (Plindo Partners).

## Source of Truth Priority

1. **PRIMARY:** Frontend API service files in `client/src/api/services/*.ts`
2. **SECONDARY:** MSW mock handlers in `client/src/_mock/handlers/` (for response shapes only)

**Rule:** If a frontend service file calls a URL → implement it. If only MSW handler exists → skip it.

## Prerequisites

- Read the full backend plan at `.verdent/backend-plan.md`
- Backend lives in `/backend/` directory
- Stack: Node.js + Express + MongoDB + JWT + Multer + Nodemailer
- Package manager: `bun` (use `bun install`, `bun add`, `bun run dev`)

---

## Step 1: Research Frontend API Service Files (PRIMARY SOURCE)

Before writing any backend code, study the **frontend service files** to understand what endpoints are actually called:

### Core Services

| Service File            | Endpoints | Description                                  |
| ----------------------- | --------- | -------------------------------------------- |
| `authService.ts`        | 1         | Unified sign-in                              |
| `userService.ts`        | 4         | Admin auth (signin, signup, logout, refresh) |
| `partnerAuthService.ts` | 4         | Partner registration, login, status check    |
| `menuService.ts`        | 1         | Menu list                                    |
| `dashboardService.ts`   | 7         | Dashboard stats & trends                     |

### Admin Management Services

| Service File            | Endpoints | Description                         |
| ----------------------- | --------- | ----------------------------------- |
| `partnerService.ts`     | 9         | Partner management (CRUD + actions) |
| `customerService.ts`    | 6         | Customer management                 |
| `bookingService.ts`     | 6         | Legacy booking management           |
| `slotBookingService.ts` | 17        | Slot-based bookings (most complex)  |
| `financeService.ts`     | 7         | Revenue, payouts, commissions       |
| `analyticsService.ts`   | 4         | Analytics dashboards                |

### Settings & Content Services

| Service File             | Endpoints | Description                 |
| ------------------------ | --------- | --------------------------- |
| `settingsService.ts`     | 12        | Platform settings           |
| `legalService.ts`        | 15        | Legal docs + FAQs           |
| `logsService.ts`         | 4         | Activity/error/payment logs |
| `notificationService.ts` | 3         | Send notifications          |
| `supportService.ts`      | 5         | Support tickets             |

### Partner Portal Services

| Service File                | Endpoints | Description                 |
| --------------------------- | --------- | --------------------------- |
| `partnerServicesService.ts` | 7         | Partner's services CRUD     |
| `productService.ts`         | 11        | Products + orders           |
| `earningsService.ts`        | 4         | Partner earnings + payouts  |
| `reviewsService.ts`         | 3         | Reviews + responses         |
| `messagesService.ts`        | 4         | Conversations + messaging   |
| `driversService.ts`         | 7         | Driver management           |
| `partnerSettingsService.ts` | 3         | Partner settings + password |
| `carsService.ts`            | 9         | Cars registry (admin)       |

## Step 1b: Check MSW Handlers for Response Shapes (SECONDARY)

Use MSW handlers **only** to understand response data shapes for endpoints that have frontend service files:

- `client/src/_mock/handlers/` — Reference for mock response structures
- `client/src/types/` — TypeScript types: `entity.ts`, `enum.ts`, `booking.ts`, `partner.ts`, `product.ts`

## Step 1c: Understand Response Format

Read `client/src/api/apiClient.ts` — The response interceptor expects `{ status: 0, data: ... }`.

**Every backend response MUST use this format:**

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
SENDGRID_API_KEY=your_sendgrid_api_key_here
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

## Step 8: Test APIs with cURL ✅ COMPLETE

**Status: All 81 tests passing (45 read + 36 write)**

Two automated test scripts are available in `backend/`:

```bash
# Read/GET endpoint tests (45 tests)
bash test-endpoints.sh

# Write/POST/PUT/PATCH/DELETE tests including full slot booking flow (36 tests)
bash test-write-endpoints.sh
```

> **Note:** Port 5000 is occupied by macOS AirPlay/ControlCenter. Run server on **port 5001**:
>
> ```bash
> PORT=5001 node src/server.js
> ```

Before running write tests, ensure the seed is fresh (write tests change partner password):

```bash
node src/seeds/seed.js
```

Test credentials:

- **Admin:** `admin@plindo.com` / `admin123`
- **Partner:** `partner@plindo.com` / `partner123`

Verify:

- Response format: `{ status: 0, message: "", data: { ... } }`
- Pagination format: `{ items: [...], total, page, limit, totalPages }`
- Logs format: `{ logs/errors/failures, pagination: { page, limit, total, totalPages } }`
- Error format: `{ status: -1, message: "..." }`
- Auth: 401 for missing/invalid tokens, 403 for wrong role

---

## Step 9: Integrate with Frontend ✅ COMPLETE

### Changes made

**1. Vite proxy** (`client/vite.config.ts`) — changed target to port 5001, removed path rewrite:

```ts
proxy: {
  "/api": {
    target: "http://localhost:5001",  // was http://localhost:3000
    changeOrigin: true,
    secure: false,
    // rewrite removed — backend already has /api prefix
  },
},
```

**2. Auth token** (`client/src/api/apiClient.ts`) — replaced hardcoded `"Bearer Token"`:

```ts
const state = authStore.getState();
const token =
  state.currentRole === "partner"
    ? state.partnerToken?.accessToken
    : state.userToken?.accessToken;
if (token) config.headers.Authorization = `Bearer ${token}`;
```

**3. MSW disabled** (`client/src/main.tsx`):

```ts
const USE_MOCK = false; // set true to re-enable MSW
if (USE_MOCK) { await worker.start({ ... }); }
```

**4. Backend route alias** (`backend/src/routes/partner/service.routes.js`):

```js
router.patch("/:id/status", toggleService); // frontend calls /status, backend had /toggle
```

### Run integration

```bash
# Terminal 1 — backend
cd backend && PORT=5001 node src/server.js

# Terminal 2 — frontend
cd client && npm run dev
# → http://localhost:3001
```

### Test results

**62/62 read endpoint tests pass** through proxy (localhost:3001 → localhost:5001).

### Notes

- `.env` / `.env.local` are gitignored — use `vite.config.ts` proxy for port config
- To re-enable MSW: set `USE_MOCK = true` in `client/src/main.tsx`
- macOS AirPlay occupies port 5000 → always use port **5001** for backend

---

## Important Rules

1. **UI-FIRST DEVELOPMENT** — Only implement endpoints that are called from `client/src/api/services/*.ts` files
2. **Skip unused MSW handlers** — If an MSW handler has no corresponding frontend service file, do NOT implement it
3. **Frontend service files first** — For features using local mock data, create the frontend service file BEFORE implementing backend
4. **ALWAYS use the response helper** — `success(res, data, message)` and `error(res, message, statusCode)`
5. **ALWAYS add pagination** — every list endpoint must accept `page` and `limit` query params
6. **Match frontend exactly** — the response shape must match what the frontend API service expects
7. **Partner data scoping** — partner endpoints must filter by the partner's own ID from JWT, never trust query params for partner identity
8. **No unnecessary packages** — only add what's needed
9. **Clean code** — proper error handling, validation, no console.log in production
10. **Activity logging** — admin actions (approve partner, suspend user, etc.) should be logged to ActivityLog

## Quick Reference: What to Implement

### ✅ ALL FEATURES HAVE FRONTEND SERVICE FILES — READY TO IMPLEMENT

**Admin APIs:**

- Auth, Dashboard, Partners, Customers, Bookings, Finance
- Settings, Legal, Logs, Analytics, Notifications, Support, Cars Registry

**Partner APIs:**

- Services, Products, Product Orders, Availability/Capacity, Bookings
- Earnings, Reviews, Messages, Drivers, Settings
