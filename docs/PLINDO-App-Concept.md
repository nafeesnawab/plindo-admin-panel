# PLINDO - Car Wash App Concept Document

---

## App Overview

A mobile platform connecting **car owners** (customers) with **car wash businesses and mobile detailers**. The app operates like Uber Eats but for vehicles — displaying a catalog of businesses, each with their own page, allowing customers to book, pay, and track their wash in real time.

**Starting market:** Cyprus  
**Expansion:** Europe and US

---

## Core Concept

- **Two user types:** Customer and Business Owner (car wash shop or mobile detailer)
- App displays a catalog of businesses similar to Uber Eats — each business has its own page with photos (up to 10), services, pricing, reviews, working hours, and estimated completion time
- Businesses share a portion of revenue as commission to the app
- App is **free of use for customers**
- Service is named **"Pick and Clean"**: picking up the vehicle → washing it → delivering it back, OR coming to your place → washing the vehicle → finishing on site

---

## Business Rules

- Business owners must have their **own driver with motor-trade insurance** (must be provided to be authorized on the app)
- Businesses must set their **working hours**
- When a booking is made, the business has **2 minutes to accept or reject**
- Businesses can choose **how far** they offer their services based on location (for Pick and Clean)
- Businesses can optionally offer **parking services** and **list products for sale** at their shop
- Businesses can **pay for ads** to appear at the top of the listing

---

## Customer Features

### Browsing & Booking
- Browse catalog of businesses
- Sort/filter by: Distance, Price, Delivery Time, "Wash at Your Place" service
- Book now or book in advance
- Advance bookings must be paid by **card** to secure the booking
- Customer and business share location so both know how far they are from each other

### Vehicle Registration
- Customer must provide: Car make, model, color, and registration number
- Pricing is **based on car size:**
  - Small car: $10
  - Medium car: $12
  - Big car: $15

### Cancellation & Refund Policy
- Customer can cancel through the app
- **Payment is NOT automatically refunded**
- Customer can talk to a human through customer service to request a refund
- **First two cancellations will be refunded** automatically
- Third cancellation onwards must go through human review
- If human customer support approves, refund is issued

### Customer Subscription (Premium)
- Monthly premium membership (e.g., €3.99/month)
- Benefits include:
  - No in-app ads
  - Priority support
  - Free cancellation
  - Discounts from partnered businesses

---

## Business Owner Features

### Listing & Profile
- Business page with up to 10 images of their work
- Service descriptions, pricing, working hours
- Estimated time of whole process displayed

### Operations
- Receive booking notifications
- Accept or reject within 2-minute window
- Update live status of booking (see Live Progress section)
- Business and customer share location during service

### Advertising
- Businesses can pay for ads to appear at the top of the listing

### Packages & Deals
- Businesses can offer **monthly or deal packages** for customers

### Analytics Dashboard
- Revenue
- Commission paid
- Number of orders
- Peak booking hours
- Customer retention stats
- Downloadable PDF invoices for accounting

---

## Advanced Features

### 1. Driver Verification & Safety
- Require driver ID verification
- Upload of insurance & license (mandatory)
- GPS tracking of driver when they pick up the customer's vehicle (similar to Uber)
- Option for customers to take photos of their car before hand-over for safety

### 2. Live Progress Tracking
Business can update status in real time — each step comes with photos:
1. Picked Up
2. In Wash
3. Drying
4. Interior Cleaning
5. On the Way Back / Complete

### 3. Automated Invoicing & Business Dashboard
- Businesses get downloadable PDFs for accounting
- Dashboard includes:
  - Revenue tracking
  - Commission paid
  - Number of orders
  - Peak booking hours
  - Customer retention stats

### 4. Tipping Feature
- Customers can add a tip through the app
- Encourages higher earnings for businesses/drivers

### 5. AI-Powered Recommendation System
Automatically sorts businesses based on:
- Customer preferences
- Previous bookings
- Customer location
- Time of day (who's available fastest)

### 6. Damage & Dispute System
- Built-in module to upload photos/videos for complaints
- Helps customer service handle damage cases properly

### 7. Customer Subscription Model (Premium)
- e.g., €3.99/month
- Benefits: No in-app ads, priority support, free cancellations, discounts from partnered businesses

### 8. In-App Wallet
- Customers can preload money
- Businesses can receive tips instantly
- Faster refunds (if approved by support)

### 9. Multi-Vehicle & Fleet Accounts
- Businesses with fleets (restaurants, delivery companies, taxi firms) can:
  - Add unlimited vehicles
  - Schedule bulk washes
  - Receive monthly invoices

### 10. Business-to-Business Service Expansion
Beyond basic car wash — future services include:
- Mobile detailing
- Ceramic coating
- Interior deep cleaning
- Scratch removal
- Headlight polishing

### 11. Loyalty System
- Customers earn points per wash
- Points can be redeemed for discounts
- Each business can choose:
  - How many points they give
  - What reward tiers they want

### 12. Weather-Based Smart Suggestions
- If rain is coming → offer discount notifications from businesses
- If clear weather for the weekend → app suggests advance booking slots

### 13. Emergency Quick Wash Feature
- "I need it now" higher-priced option
- Businesses receive a special alert for premium fast jobs

### 14. Multi-Language Support
Starting languages:
- Greek
- English
- Arabic
- Romanian
- Russian

### 15. Corporate ERP Integration (Future)
- Large companies can sync: billing, fleet details, vehicle locations

---

## Customer Service
- Available during all working hours of businesses
- **AI chatbot handles first contact**
- If needed, escalates to a human agent
- Human can approve refunds case by case

---

## Payment Methods
- Pay through the app
- Pay in cash (option available)
- **Advance bookings must be paid by card**

---

## User Templates

### Customer Template
Browse → Filter → Book → Track Live Progress → Chat with Business → Pay → Rate → Tip → Manage Wallet & Subscriptions

### Business Template
Manage Listing → Pictures → Pricing → Availability → Driver Verification → Incoming Orders → Ads → Analytics → Reviews

---

## App UI Requirements
- **Background:** Black
- **Buttons:** Blue
- **Reference design:** Wolt Cyprus (food delivery app)
- **Tone:** Friendly text character, mainly black and blue colors
- Simple, modern, and scalable

---

## Screens Required

### Customer App
1. Browse / Home (catalog view)
2. Business Profile Page
3. Service Selection & Booking
4. Advance Booking (calendar + payment)
5. Live Progress Tracker
6. My Bookings (upcoming / past / cancelled)
7. Wallet
8. Subscription Plans
9. Rating & Review
10. Notifications
11. Profile & Vehicle Management
12. Customer Support (AI + Human chat)
13. Damage/Dispute Submission

### Business App
1. Login & Verification
2. Dashboard (orders, revenue, stats)
3. Incoming Bookings (accept/reject in 2 min)
4. Live Status Updates
5. Earnings & Commission View
6. Reviews & Responses
7. Profile & Service Management
8. Availability Calendar
9. Advertising Panel
10. Invoice Downloads

---

## Architecture Requirements
- Full UI/UX flow for each action (customer and business)
- Complete app structure (screens, navigation, states)
- Clean, modern UI design
- Database structure and backend requirements
- Scalable architecture for multiple countries
- Security considerations (payment, location sharing, user verification)
- Monetization model: commissions, ads, subscriptions
- Launch strategy for Cyprus + expansion roadmap

---

## Security Considerations
- Payment security
- Location sharing privacy
- User verification (ID, insurance, license)
- Damage photo/video storage
- GDPR compliance

---

## Monetization Model
1. **Commission** – percentage of each transaction
2. **Advertising** – businesses pay to appear at top of listing
3. **Customer Subscriptions** – premium membership (e.g., €3.99/month)
4. **Future:** Subscription fee for businesses

---

## Launch & Expansion Strategy
- **Phase 1:** Cyprus launch
- **Phase 2:** European expansion
- **Phase 3:** US market
- App structure must support multi-country, multi-language from the start
