# Booking Flow Implementation Plan

This document outlines the practical workflow for implementing the hotel booking flow using the multi-agent setup.

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOOKING FLOW PHASES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [1. ROOM SELECTION]  →  [2. GUEST INFO]  →  [3. PAYMENT/BOOK]     │
│                                                                      │
│  Each phase follows:  SPY → PLAN → EXECUTE → VERIFY                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Room Selection

### Step 1.1: SPY (Chrome)

**Action in hotels.bellhopping.com:**
1. Search for a hotel (you already have search working)
2. Click on a hotel to see room options
3. Open DevTools > Network tab
4. Look for API calls when room list loads

**What to capture:**
- Request URL (likely GetHotelContentRQ or similar)
- Request headers (especially Authorization)
- Request payload (hotel code, dates, etc.)
- Response structure (room types, rates)

**Copy this format:**
```
URL: POST /v?/...
Headers: {...}
Payload: {...}
Response: {...}
```

### Step 1.2: PLAN (Web Claude - Here)

Paste the captured data here. I will:
- Map payload fields to your existing types
- Design the API endpoint (`/api/hotels/[code]/rooms`)
- Create TypeScript interfaces for room data
- Plan the RoomSelection component

### Step 1.3: EXECUTE (iTerm Claude)

```
"Implement the room selection API based on this plan:
[paste plan]

Create:
1. src/app/api/hotels/[code]/rooms/route.ts
2. src/lib/sabre/rooms.ts
3. src/components/RoomCard.tsx
4. Update hotel details page"
```

### Step 1.4: VERIFY (Chrome Extension)

1. Navigate to localhost:3000/hotels/[code]
2. Check if rooms display correctly
3. Compare layout with hotels.bellhopping.com
4. Test room selection interaction

---

## Phase 2: Guest Information

### Step 2.1: SPY (Chrome)

**Action in hotels.bellhopping.com:**
1. Select a room
2. Proceed to guest information form
3. Fill out the form
4. Watch Network tab for validation calls

**What to capture:**
- Form field names and validation rules
- Any API calls during form interaction
- Guest data structure expected by Sabre

### Step 2.2: PLAN (Web Claude)

Paste form structure. I will:
- Design GuestForm component
- Create validation schema (Zod or similar)
- Map to Sabre's PassengerNameRecord format
- Plan state management

### Step 2.3: EXECUTE (iTerm Claude)

```
"Implement guest information form:
1. src/components/GuestForm.tsx
2. src/lib/validation/guest.ts
3. Add form state to booking flow"
```

### Step 2.4: VERIFY (Chrome)

- Test form validation
- Check mobile responsiveness
- Verify error states display

---

## Phase 3: Payment & Booking

### Step 3.1: SPY (Chrome) - CRITICAL

**Action in hotels.bellhopping.com:**
1. Fill guest form and proceed
2. Enter payment details
3. **CAPTURE THE BOOKING REQUEST** - This is the key payload
4. See confirmation response

**What to capture:**
- CreatePassengerNameRecordRQ payload (or equivalent)
- Credit card handling (likely tokenized)
- Booking confirmation response format

**Security Note:** Do not capture real credit card numbers. Use test data.

### Step 3.2: PLAN (Web Claude)

This is the most complex phase. I will:
- Map complete booking payload
- Design `/api/bookings` endpoint
- Plan error handling for payment failures
- Create confirmation email structure

### Step 3.3: EXECUTE (iTerm Claude)

```
"Implement booking endpoint:
1. src/app/api/bookings/route.ts
2. src/lib/sabre/booking.ts
3. Update Prisma Booking model usage
4. Create confirmation page"
```

### Step 3.4: VERIFY (Chrome)

- Complete full booking flow
- Check confirmation displays
- Verify Booking saved to database
- Compare confirmation with hotels.bellhopping.com

---

## Expected Sabre Endpoints

Based on common Sabre patterns:

| Phase | Likely Endpoint | Purpose |
|-------|-----------------|---------|
| Rooms | `GetHotelContentRQ` | Room types & rates |
| Rooms | `GetHotelDescriptiveInfoRQ` | Room details & images |
| Book | `CreatePassengerNameRecordRQ` | Create reservation |
| Confirm | `GetReservationRQ` | Fetch booking details |

**DO NOT ASSUME** - Verify against hotels.bellhopping.com network traffic.

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Search      │     │  Room Select │     │  Guest Form  │
│  (Complete)  │────▶│  HotelCode   │────▶│  + Rooms     │
└──────────────┘     │  Dates       │     │  + Guest     │
                     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐             │
                     │  Confirm     │◀────────────┘
                     │  Booking     │     ┌──────────────┐
                     │  Email       │◀────│  Payment     │
                     └──────────────┘     │  CreatePNR   │
                                          └──────────────┘
```

---

## Session Commands Reference

### Start New Phase (iTerm)
```bash
# Tell Claude the phase
"We're starting Phase 1: Room Selection.
Read BOOKING_FLOW_PLAN.md for context."
```

### Pass Captured Payload (iTerm → Web)
```bash
# After capturing in Chrome, paste to Web Claude
"Analyze this room selection payload I captured from hotels.bellhopping.com:
[paste payload]"
```

### Execute Plan (Web → iTerm)
```bash
# After planning here, copy to iTerm
"Implement this room selection plan:
[paste plan from web session]"
```

### Verify Changes (iTerm → Chrome)
```bash
# After implementation
"Open localhost:3000/hotels/ABC123 and verify rooms display"
```

---

## Progress Tracking

Update this as you progress:

### Phase 1: Room Selection
- [ ] Spy: Capture GetHotelContent request
- [ ] Plan: Design room API in Web Claude
- [ ] Execute: Implement in iTerm
- [ ] Verify: Test in Chrome

### Phase 2: Guest Information
- [ ] Spy: Capture form structure
- [ ] Plan: Design form component
- [ ] Execute: Implement in iTerm
- [ ] Verify: Test validation

### Phase 3: Payment & Booking
- [ ] Spy: Capture CreatePNR request
- [ ] Plan: Design booking API
- [ ] Execute: Implement in iTerm
- [ ] Verify: Complete test booking

---

## Ready to Start?

When you're ready to begin Phase 1:

1. **In Chrome:** Go to hotels.bellhopping.com, search for a hotel, click to see rooms
2. **Capture:** Copy the network request that loads rooms
3. **Paste here:** Share the payload and I'll create the implementation plan

The workflow begins with YOU providing the spy data. I cannot guess what hotels.bellhopping.com sends.
