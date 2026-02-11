# Capacity-Based Dynamic Scheduling System - Implementation TODO

## Overview

Implementing a capacity-based scheduling system for car wash services with:

- Multiple bays per service category (5 wash bays, 2 detailing bays)
- Dynamic time windows based on service duration
- Bay assignment for bookings
- Simplified UI

## Progress Tracker

### Phase 1: Update Types (`src/types/booking.ts`) ✅

- [x] Add `ServiceCategory` type
- [x] Add `Bay` interface
- [x] Add `PartnerCapacity` interface
- [x] Update `TimeSlot` with capacity tracking
- [x] Update `WeeklyAvailability` with capacity config
- [x] Update `SlotBooking` with bay assignment

### Phase 2: Update Mock Handler (`src/_mock/handlers/_slot-bookings.ts`) ✅

- [x] Add capacity configuration store
- [x] Update SERVICES with category field
- [x] Rewrite `getAvailableSlots` for capacity-aware logic
- [x] Update `createSlotBooking` with bay assignment
- [x] Add capacity configuration endpoint

### Phase 3: Update Partner Services Mock (`src/_mock/handlers/_partner-services.ts`)

- [ ] Add `serviceCategory` field to Service interface (optional - can be done later)
- [ ] Map services to categories

### Phase 4: Update API Service (`src/api/services/slotBookingService.ts`) ✅

- [x] Add capacity management API calls
- [x] Update slot availability params

### Phase 5: Update Schedule Page (`src/pages/partner/schedule/index.tsx`) ✅

- [x] Simplify UI - removed complex drag calendar
- [x] Add capacity configuration section (wash bays, detailing bays)
- [x] Add working hours per day
- [x] Add buffer time setting

### Phase 6: Update Bookings Page (`src/pages/partner/bookings/index.tsx`) ✅

- [x] Show bay assignment and category
- [x] Color-code by service category (blue=wash, purple=detailing)
- [x] Add category filter dropdown
- [x] Update stats to show wash/detailing counts

### Phase 7: Update Services Page (`src/pages/partner/services/index.tsx`)

- [ ] Add service category selection (optional - can be done later)
- [ ] Simplify UI

## Implementation Complete! 🎉

## Key Concepts

### Capacity-Based Scheduling

- Each partner has bays organized by service category
- Wash services use wash bays (default: 5)
- Detailing services use detailing bays (default: 2)
- A time slot is only "full" when ALL bays in that category are booked
- Different categories operate independently

### Dynamic Time Windows

- Instead of fixed 30-min slots, windows are based on service duration
- A 90-minute detailing service shows 90-min windows
- A 20-minute express wash shows 20-min windows
- Windows are generated at 15-minute intervals

### Bay Assignment

- When booking is created, system finds first available bay
- Bay is assigned to booking (bayId, bayName)
- Overlapping bookings on same bay are prevented
- Buffer time between bookings on same bay

## Files Changed

1. `src/types/booking.ts` - Complete rewrite with capacity-based types
2. `src/_mock/handlers/_slot-bookings.ts` - Complete rewrite with capacity logic
3. `src/api/services/slotBookingService.ts` - Added capacity endpoints
4. `src/pages/partner/schedule/index.tsx` - Simplified UI with capacity config
5. `src/pages/partner/bookings/index.tsx` - Category filtering and bay display
