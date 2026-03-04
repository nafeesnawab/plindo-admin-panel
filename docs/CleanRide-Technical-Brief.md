# CleanRide - Mobile App Development Brief
## Car Wash Booking Platform for Cyprus

---

## Project Overview

**What we're building:** A two-sided marketplace mobile app connecting car owners with car wash service providers in Cyprus. Users can book car washes at partner locations, either by visiting the station or using pick-up/delivery service.

**Business Model:**
- Platform charges 10% commission from customers + 10% from service providers
- Subscription plans available (€15–28/month)
- Pure marketplace model (we don't provide the washing service)

**Target Launch:** MVP in 8–12 weeks

---

## Core User Flows

### 1. Customer User Flow

#### Registration & Onboarding
1. Download app (iOS/Android)
2. Sign up (email/phone + password, or social login)
3. Add vehicle details (make, model, plate number, color)
4. Add payment method (credit card via Stripe)
5. Enable location services
6. Complete profile

#### Booking Flow
1. Open app → see nearby car wash locations on map
2. Select a location
3. View services offered (Basic wash €12, Premium €20, Interior €25, etc.)
4. Choose service type
5. Pick date & time slot (calendar view with available slots)
6. Review booking details
7. Add any special instructions (optional)
8. Confirm booking
9. Pay automatically (€12.50 wash + 10% = €13.75 total)
10. Receive confirmation notification
11. Get reminder notification 24h before + 1h before

#### Post-Booking
1. Track booking status (Confirmed → In Progress → Completed)
2. Receive completion notification
3. Rate service (1–5 stars) + leave review
4. Receive digital receipt via email

#### Subscription Flow
1. View subscription options on Profile screen
2. Select plan (Basic €15/month or Premium €28/month)
3. Review benefits
4. Subscribe (first month can be discounted)
5. Manage subscription in Profile (upgrade/downgrade/cancel)
6. Track included washes remaining this month

---

### 2. Service Provider User Flow

#### Registration
1. Apply to join platform (via web or separate partner app)
2. Provide business details (name, license, location, photos)
3. Admin reviews and approves
4. Set up services menu and pricing
5. Configure availability calendar

#### Daily Operations
1. Receive booking notification (push + in-app)
2. Accept or decline booking (within 2 hours)
3. View daily schedule (list + calendar view)
4. Mark booking as "In Progress" when customer arrives
5. Mark as "Completed" when done
6. View payment confirmation (90% of booking value)

#### Dashboard
1. See today's bookings
2. View earnings (daily/weekly/monthly)
3. Check ratings and reviews
4. Manage calendar availability
5. Update service prices
6. View analytics

---

### 3. Admin User Flow

#### Partner Management
1. Review new partner applications
2. Approve/reject partners
3. Monitor partner performance (ratings, completion rate)
4. Suspend/remove partners if needed
5. Handle disputes

#### Platform Management
1. View all bookings (real-time)
2. Monitor revenue
3. Track user growth
4. Send push notifications to users
5. Manage pricing/commissions
6. Generate reports

---

## Technical Requirements

### Platform & Technology Stack

#### Mobile Apps
- React Native (single codebase for iOS + Android)
- React Navigation (navigation)
- Redux or Context API (state management)
- React Native Maps (map integration)

#### Backend
- Node.js + Express (API server)
- PostgreSQL (main database)
- Redis (caching, session management)
- JWT for authentication

#### Payment Processing
- **Stripe** (credit card payments, subscriptions)
- Support for Mastercard, Visa, Apple Pay, Google Pay

#### Hosting & Infrastructure
- AWS or DigitalOcean (server hosting)
- AWS S3 (image storage)
- SendGrid or AWS SES (email notifications)
- Firebase or OneSignal (push notifications)

#### Other Services
- Google Maps API (maps, geocoding, distance calculation)
- Twilio (SMS notifications – optional)
- Cloudinary (image processing/optimization)

---

## Database Schema (Key Tables)

### Users Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| email | unique |
| phone | unique |
| password_hash | — |
| first_name | — |
| last_name | — |
| profile_photo_url | — |
| user_type | customer/partner/admin |
| created_at | — |
| updated_at | — |
| is_active | boolean |

### Vehicles Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| user_id | FK → Users |
| make | — |
| model | — |
| year | — |
| color | — |
| license_plate | — |
| is_primary | boolean |
| created_at | — |

### Partners Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| user_id | FK → Users |
| business_name | — |
| business_license_number | — |
| address | — |
| latitude | — |
| longitude | — |
| phone | — |
| email | — |
| description | — |
| logo_url | — |
| cover_photo_url | — |
| average_rating | calculated |
| total_reviews | count |
| is_verified | boolean |
| status | pending/approved/suspended |
| created_at | — |
| updated_at | — |

### Services Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| partner_id | FK → Partners |
| name | e.g., "Basic Exterior Wash" |
| description | — |
| price | in cents (e.g., 1250 for €12.50) |
| duration_minutes | e.g., 30 |
| is_active | boolean |
| created_at | — |
| updated_at | — |

### Bookings Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| booking_number | unique (e.g., "CR-20250107-001") |
| user_id | FK → Users |
| vehicle_id | FK → Vehicles |
| partner_id | FK → Partners |
| service_id | FK → Services |
| booking_date | — |
| booking_time | — |
| status | pending/confirmed/in_progress/completed/cancelled |
| service_price | amount customer pays |
| platform_fee | 10% from customer |
| commission | 10% from partner |
| total_amount | service_price + platform_fee |
| payment_intent_id | Stripe |
| special_instructions | text |
| rating | 1–5, null until rated |
| review_text | — |
| created_at | — |
| updated_at | — |
| completed_at | — |

### Partner_Availability Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| partner_id | FK → Partners |
| day_of_week | 0–6 (0=Sunday) |
| start_time | e.g., "08:00" |
| end_time | e.g., "18:00" |
| is_available | boolean |

### Subscriptions Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| user_id | FK → Users |
| plan_type | basic/premium |
| stripe_subscription_id | — |
| status | active/cancelled/expired |
| current_period_start | — |
| current_period_end | — |
| washes_included | 1 for basic, 2 for premium |
| washes_used_this_period | counter |
| created_at | — |
| updated_at | — |
| cancelled_at | — |

### Payments Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| booking_id | FK → Bookings |
| user_id | FK → Users |
| amount | in cents |
| currency | EUR |
| stripe_payment_intent_id | — |
| status | pending/succeeded/failed/refunded |
| created_at | — |

### Reviews Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| booking_id | FK → Bookings |
| user_id | FK → Users |
| partner_id | FK → Partners |
| rating | 1–5 |
| review_text | — |
| response_text | partner can respond |
| created_at | — |
| updated_at | — |

### Notifications Table
| Field | Type |
|---|---|
| id | UUID, primary key |
| user_id | FK → Users |
| type | booking_confirmed/booking_reminder/etc. |
| title | — |
| message | — |
| is_read | boolean |
| created_at | — |

---

## API Endpoints (Backend)

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Users
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/vehicles`
- `GET /api/users/vehicles`
- `PUT /api/users/vehicles/:id`
- `DELETE /api/users/vehicles/:id`

### Partners
- `GET /api/partners`
- `GET /api/partners/:id`
- `GET /api/partners/:id/services`
- `GET /api/partners/:id/reviews`
- `GET /api/partners/:id/availability`
- `POST /api/partners/apply`

### Bookings
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/rate`
- `POST /api/bookings/:id/review`

### Subscriptions
- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/subscribe`
- `GET /api/subscriptions/current`
- `PUT /api/subscriptions/cancel`
- `PUT /api/subscriptions/upgrade`

### Payments
- `POST /api/payments/create-intent`
- `POST /api/payments/confirm`
- `GET /api/payments/history`

### Partner Dashboard
- `GET /api/partner/bookings`
- `PUT /api/partner/bookings/:id/accept`
- `PUT /api/partner/bookings/:id/decline`
- `PUT /api/partner/bookings/:id/start`
- `PUT /api/partner/bookings/:id/complete`
- `GET /api/partner/earnings`
- `GET /api/partner/stats`
- `PUT /api/partner/availability`
- `PUT /api/partner/services`

### Admin
- `GET /api/admin/partners/pending`
- `PUT /api/admin/partners/:id/approve`
- `PUT /api/admin/partners/:id/reject`
- `GET /api/admin/bookings`
- `GET /api/admin/stats`
- `POST /api/admin/notifications/broadcast`

### Search & Filters
- `GET /api/search/partners?lat=35.1264&lng=33.4299&radius=5`
- `GET /api/search/partners?service=basic&date=2025-01-15`

---

## Key Features & Functionality

### 1. Map & Location Features
- Show all partner locations on interactive map
- User's current location shown
- Partner pins with different colors (available/busy/closed)
- Tap pin to see partner details
- "Near Me" filter
- Distance calculation
- Directions integration (Google Maps/Apple Maps)
- Use Google Maps SDK for React Native
- Cluster pins when zoomed out
- Real-time updates of partner availability

### 2. Booking & Scheduling

**Calendar System:**
- Show available time slots for selected date
- 30-minute slot intervals (9:00, 9:30, 10:00…)
- Partners can set capacity (e.g., 4 bookings per 30-min slot)
- Prevent double-booking
- Handle partner working hours (8 AM – 6 PM)
- Handle partner days off

**Booking Rules:**
- Minimum advance booking: 2 hours
- Maximum advance booking: 30 days
- Cancellation allowed up to 2 hours before booking
- Automatic cancellation refund (minus processing fee)

### 3. Payment System

**Stripe Integration:**
- Save customer cards securely (Stripe tokens, never store card numbers)
- Charge customer immediately upon booking
- Hold funds until service completion
- Automatic payout to partners (weekly schedule)
- Partners receive 90% (platform keeps 20%, customer pays extra 10%)
- Handle refunds for cancellations
- Support for subscription billing (recurring monthly)
- Handle failed payments (retry logic, notifications)

**Payment Flow:**
1. User books wash for €12.50
2. Platform adds 10% fee = €13.75 total charge to user
3. Stripe charges user's card €13.75
4. Service completed
5. Partner receives €11.25 (90% of €12.50)
6. Platform keeps €2.50 (€1.25 from user + €1.25 from partner)

**Subscription Flow:**
1. User subscribes to Basic (€15/month)
2. Stripe charges €15 monthly
3. User gets 1 "free" wash per month
4. System tracks: `washes_used_this_period`
5. If user books 2nd wash same month → charged €13.75 as normal
6. Next month: counter resets to 0

### 4. Notifications System

**Push Notifications:**
- Booking confirmed
- Booking reminder (24 hours before)
- Booking reminder (1 hour before)
- Booking started ("In Progress")
- Booking completed
- Partner accepted/declined booking
- Review reminders (24 hours after service)
- Subscription renewal reminder
- Payment failed
- Special promotions

**Email Notifications:**
- Booking confirmation with details
- Booking receipt after completion
- Password reset
- Monthly subscription receipt
- Account activity

**In-App Notifications:**
- Notification center
- Unread badge count
- Mark as read

### 5. Rating & Review System
- Users can rate only completed bookings
- 1–5 star rating (required) + written review (optional, max 500 characters)
- Partners can respond to reviews
- Reviews displayed on partner profile
- Average rating calculated automatically
- Sort reviews: Most recent / Highest rated / Lowest rated
- Report inappropriate reviews
- Partners with < 3.5 stars get warning; < 3.0 stars suspended

### 6. Subscription Management

**User Capabilities:**
- View current plan details
- See washes remaining this month
- Upgrade plan (immediate, prorated)
- Downgrade plan (takes effect next billing cycle)
- Cancel subscription (access until period ends)
- View billing history
- Update payment method

**System Requirements:**
- Track usage per billing period
- Reset counter on renewal
- Handle upgrade/downgrade proration
- Retry failed payments (3 attempts)
- Send expiration warnings
- Auto-cancel after failed payment retries

### 7. Admin Dashboard (Web-based)
- Overview: Active users, bookings today, revenue today
- User management: View, search, suspend users
- Partner management: Approve, reject, suspend partners
- Booking management: View all bookings, resolve issues
- Financial reports: Revenue, commissions, payouts
- Analytics: Charts and graphs
- Broadcast notifications
- Platform settings management

**Tech Stack:** React.js + Chart.js/Recharts, same backend API with admin auth

---

## UI/UX Design Requirements

### Customer App Screens
1. Splash Screen
2. Onboarding (3–4 slides)
3. Login/Register
4. Home Screen (Map view)
5. Partner List View
6. Partner Detail
7. Booking Flow
8. My Bookings (Upcoming / Past / Cancelled tabs)
9. Booking Detail
10. Profile
11. Vehicles
12. Subscription Plans
13. My Subscription
14. Payment Methods
15. Booking History
16. Notifications
17. Settings
18. Help/Support
19. Rate Service

### Partner App Screens
1. Login
2. Dashboard
3. Bookings
4. Booking Detail
5. Schedule (Calendar)
6. Earnings
7. Reviews
8. Profile
9. Availability
10. Settings

### Design Guidelines

**Color Scheme:**
- Primary: Blue `#1E88E5`
- Secondary: Green `#43A047`
- Accent: Orange `#FB8C00`
- Background: White/Light Gray
- Text: Dark Gray/Black

**Typography:**
- Headers: Bold, 18–24pt
- Body: Regular, 14–16pt
- Captions: Regular, 12pt

**Components:**
- Rounded buttons (8px border radius)
- Card-based layouts with shadows
- Bottom tab navigation (Home, Bookings, Profile)
- Smooth animations and transitions
- Loading states for all async operations
- Empty states with helpful messages
- Clear, actionable error messages

**Accessibility:**
- Support for larger text sizes
- High contrast mode
- Screen reader compatible
- Touch targets minimum 44×44pt

---

## Non-Functional Requirements

### Performance
- App launch time: < 3 seconds
- API response time: < 500ms (p95)
- Map loading: < 2 seconds
- Image loading: Progressive (low res → high res)
- Offline capability: View past bookings, profile info

### Security
- HTTPS for all API calls
- JWT tokens with expiration (refresh tokens)
- Password hashing (bcrypt, min 10 rounds)
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention
- Rate limiting on API endpoints
- PCI DSS compliance (handled by Stripe)
- GDPR compliance

### Scalability
- Database indexing on frequently queried fields
- Caching for partner data, services (Redis)
- CDN for images (Cloudinary)
- Horizontal scaling capability
- Database connection pooling
- API rate limiting per user

### Reliability
- 99.5% uptime target
- Automated backups (daily)
- Error logging (Sentry or similar)
- Health check endpoints
- Graceful error handling
- Automatic retries for failed payments

### Monitoring
- Application monitoring (New Relic or DataDog)
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)
- Key metrics: DAU, booking conversion rate, average booking value, subscription conversion rate, churn rate, partner ratings

---

## MVP Scope (8–12 Weeks)

### Phase 1: Core Features (Weeks 1–6)
- User authentication (login, register)
- Customer profile with vehicles
- Map view with partner locations
- Partner detail pages
- Service selection
- Date/time booking (simple calendar)
- Stripe payment integration
- Booking confirmation
- My Bookings list (upcoming/past)
- Basic notifications (email only initially)
- Rating after completed booking

### Phase 2: Partner Features (Weeks 7–8)
- Partner app/web dashboard
- Accept/decline bookings
- Mark booking as complete
- View earnings
- Basic availability management

### Phase 3: Polish & Testing (Weeks 9–12)
- Push notifications
- UI/UX improvements
- Bug fixes
- Performance optimization
- Admin dashboard (basic)
- Test payment flows thoroughly
- Beta testing with 5–10 users

### Post-MVP Features
- Subscription plans
- Advanced filters and search
- Favorite partners
- Referral program
- Loyalty points
- Multiple language support (Greek, English)
- Apple Pay / Google Pay
- In-app chat with partners
- Photo upload (car condition before/after)
- Booking history export
- Gift cards

---

## Testing Requirements

### Functional Testing
- Complete booking flow (happy path)
- Payment processing (success and failure)
- Cancellation and refunds
- Partner acceptance/decline flow
- Rating and review submission
- Notification delivery
- Edge cases (no internet, concurrent bookings, etc.)

### User Testing
- 10–20 beta users
- Collect UX feedback
- Test on different devices (iOS/Android, various screen sizes)

### Payment Testing
- Test credit cards (Stripe test mode)
- Failed payments
- Refunds
- Subscription billing
- Payout to partners

### Performance Testing
- Load testing (simulate 100+ concurrent users)
- Database query optimization
- API response times under load

---

## Deliverables Expected

### Mobile Apps
- React Native codebase
- Compiled iOS app (IPA file)
- Compiled Android app (APK/AAB file)
- App icons and splash screens

### Backend
- Node.js/Express API server
- Database schema and migrations
- API documentation
- Postman collection for API testing

### Admin Dashboard
- React web app
- Deployment package

### Documentation
- README with setup instructions
- API documentation
- Environment variables list
- Deployment guide
- Database schema documentation

### Source Code
- GitHub repository access
- Clear code comments
- Organized folder structure

### Accounts Setup Help
- Stripe account configuration
- Google Maps API setup
- Push notification service setup
- AWS/hosting setup

---

## Timeline & Milestones

| Weeks | Focus |
|---|---|
| 1–2 | Setup & Foundation (project setup, DB design, auth, basic API) |
| 3–4 | Core Booking Features (map, booking flow, payments, CRUD) |
| 5–6 | Customer Features (My Bookings, profile, rating, email notifications) |
| 7–8 | Partner Features (dashboard, booking management, earnings, availability) |
| 9–10 | Polish & Integration (push notifications, UI/UX, bug fixes, performance) |
| 11–12 | Testing & Launch Prep (beta testing, QA, app store submission) |

**Cost Optimization Tips:**
- Start with DigitalOcean ($50–100/month) instead of AWS
- Use free tier services where possible
- Optimize Google Maps API calls (caching, clustering)
- Monitor usage to avoid unexpected costs

---

## Questions for Developer

### Experience
- Have you built React Native apps before? Can you show examples?
- Have you integrated Stripe payments?
- Have you built marketplace/booking platforms?
- Do you have experience with Google Maps API?

### Timeline
- How long will MVP take? (realistic estimate)
- Will you work full-time or part-time?
- What's your availability per week?

### Tech Stack
- Do you agree with the recommended stack, or do you suggest alternatives?
- What database would you recommend and why?
- What hosting do you recommend?

### Deliverables
- Will you provide documentation?
- Will you help with app store submission?
- Will you set up hosting and deployment?
- What's included in source code handover?

### Support
- Do you offer post-launch support?
- What's your rate for maintenance and updates?
- How do you handle bugs found after delivery?

### Payment Structure
- Fixed price or hourly rate?
- Payment milestones?
- What happens if timeline extends?

---

## Red Flags & Green Flags

### Warning Signs (Bad Developer)
- Promises MVP in 2–4 weeks
- Won't show previous work examples
- Doesn't ask clarifying questions
- Wants 100% upfront payment
- Can't explain technical decisions
- Poor communication
- No testing plan
- No documentation promise

### Good Signs
- Asks lots of questions about requirements
- Provides detailed proposal with timeline
- Shows portfolio of similar projects
- Suggests improvements
- Clear communication
- Milestone-based payment
- Offers post-launch support
- Uses version control (Git)

---

## Final Checklist

- [ ] This technical requirements document
- [ ] Business model clarity
- [ ] Budget defined
- [ ] Timeline expectations set
- [ ] Stripe account created (or ready to create)
- [ ] Google Maps API key (or ready to create)
- [ ] Company registered in Cyprus
- [ ] Bank account opened
- [ ] Logo designed (can do in parallel)
- [ ] Domain name purchased (cleanride.cy or cleanride.com.cy)
