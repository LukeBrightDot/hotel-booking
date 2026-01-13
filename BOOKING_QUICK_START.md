# Booking Implementation - Quick Start Guide

**For:** Sonnet 4.5 Terminal Agent
**Date:** 2026-01-13

---

## TL;DR - Start Here

```bash
# 1. Run discovery test to find booking endpoint
npx ts-node scripts/test-booking-endpoint.ts

# 2. Document results
# Update BOOKING_DISCOVERY_RESULTS.md with findings

# 3. Implement booking service
# Follow BOOKING_IMPLEMENTATION_PLAN.md Phase 1
```

---

## What You Need to Know

### Critical Gap Identified
The assumed Sabre booking endpoint `POST /v2.0.0/book/hotels` is **NOT documented** in official Sabre REST API docs. We need to **discover the actual endpoint** before implementation.

### Your Mission
1. **Discover** the actual working endpoint (Phase 0)
2. **Implement** booking service once confirmed (Phase 1)
3. **Build** frontend form with address fields (Phase 2)
4. **Test** thoroughly with various scenarios (Phase 3)

---

## Phase 0: Discovery (START HERE)

### Run the Test
```bash
cd /home/user/hotel-booking
npm run dev  # Ensure server is running
npx ts-node scripts/test-booking-endpoint.ts
```

### What It Does
- Tests 7 potential endpoints
- Tries both minimal and structured payloads
- Reports which endpoints exist (not 404)
- Shows error messages for debugging

### Expected Outcomes
1. **✅ Found endpoint** → Status 200/201/400
   - 200/201 = Works perfectly!
   - 400 = Exists, but payload needs adjustment

2. **❌ All 404** → Need to use SOAP API
   - Contact Sabre support
   - Or explore EnhancedHotelBookRQ (SOAP)

### Document Results
Create `BOOKING_DISCOVERY_RESULTS.md`:

```markdown
# Booking Endpoint Discovery Results

**Date:** [Today]
**Tested By:** Sonnet 4.5 Agent

## Working Endpoint
- URL: [Found endpoint]
- Status: [200/201/400]
- Payload Format: [minimal/structured]

## Sample Response
```json
[Paste response]
```

## Next Steps
- Update `src/lib/sabre/booking.ts` endpoint
- Proceed to Phase 1 implementation
```

---

## Phase 1: Core Implementation

### Once Endpoint is Confirmed

**1. Create Types**
```bash
# Already defined in BOOKING_IMPLEMENTATION_PLAN.md Phase 1.1
# Copy to: src/types/booking.ts
```

**2. Create Booking Service**
```bash
# Copy template from BOOKING_IMPLEMENTATION_PLAN.md Phase 1.2
# File: src/lib/sabre/booking.ts
# UPDATE endpoint variable with discovered endpoint!
```

**3. Create API Route**
```bash
# Copy from BOOKING_IMPLEMENTATION_PLAN.md Phase 1.3
# File: src/app/api/booking/create/route.ts
```

**4. Test the Service**
```bash
# Manual test with curl
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "context": { ... },
    "guest": { ... },
    "payment": { ... }
  }'
```

---

## Phase 2: Frontend

### Key Components to Build

1. **BookingForm.tsx**
   - Guest info section
   - ⚠️ **ADDRESS FIELDS** (required by Sabre, NOT in bellhopping!)
   - Payment section
   - Special requests

2. **Booking Page**
   - File: `src/app/hotels/[code]/booking/page.tsx`
   - Load booking context from search
   - Render BookingForm
   - Handle submission

3. **Confirmation Page**
   - File: `src/app/booking/confirmation/[id]/page.tsx`
   - Display confirmation details
   - Show all confirmation numbers

---

## Phase 3: Testing

### Test Cases

1. **Happy Path**
   ```bash
   # Complete booking with valid data
   # Expect: 200, confirmation number
   ```

2. **Missing Address**
   ```bash
   # Submit without guest address
   # Expect: 400, "address required" error
   ```

3. **Invalid Card**
   ```bash
   # Use invalid card number
   # Expect: 400, card validation error
   ```

4. **Expired Rate**
   ```bash
   # Wait 15 minutes after search
   # Expect: 400, rate unavailable
   ```

---

## Common Issues & Solutions

### Issue: All Endpoints Return 404
**Cause:** REST API not available
**Solution:** Must use SOAP API (EnhancedHotelBookRQ)
**Action:** Contact Sabre or explore SOAP implementation

### Issue: 401 Unauthorized
**Cause:** Auth token expired or invalid
**Solution:** Check auth is working: `curl http://localhost:3000/api/auth/test`

### Issue: 400 with "missing field" error
**Cause:** Payload structure incorrect
**Solution:** Look at error message, add missing fields

### Issue: Address fields rejected
**Cause:** Wrong format or country code
**Solution:** Use ISO 2-letter country codes (US, CA, GB, etc.)

---

## Files Checklist

### Phase 0 - Discovery
- [x] `scripts/test-booking-endpoint.ts` (created)
- [ ] `BOOKING_DISCOVERY_RESULTS.md` (create after test)

### Phase 1 - Core
- [ ] `src/types/booking.ts`
- [ ] `src/lib/sabre/booking.ts`
- [ ] `src/app/api/booking/create/route.ts`

### Phase 2 - Frontend
- [ ] `src/components/BookingForm.tsx`
- [ ] `src/app/hotels/[code]/booking/page.tsx`
- [ ] `src/app/booking/confirmation/[id]/page.tsx`

### Phase 3 - Testing
- [ ] End-to-end booking test
- [ ] Error handling tests
- [ ] Security review

---

## Security Reminders

### ⚠️ PCI Compliance CRITICAL

```typescript
// ✅ GOOD - Store only last 4 digits
cardLast4: cardNumber.slice(-4)

// ❌ BAD - NEVER store full number
cardNumber: '4111111111111111'  // ILLEGAL!

// ❌ BAD - NEVER store CVV
cvv: '123'  // ILLEGAL!
```

### Sanitize Logs
```typescript
console.log({
  ...booking,
  cardNumber: '****-****-****-' + booking.cardNumber.slice(-4),
  cvv: '[REDACTED]',
});
```

---

## Progress Tracking

Update as you complete each phase:

- [ ] **Phase 0:** Discovery test run
- [ ] **Phase 0:** Results documented
- [ ] **Phase 0:** Endpoint confirmed
- [ ] **Phase 1:** Types created
- [ ] **Phase 1:** Booking service implemented
- [ ] **Phase 1:** API route created
- [ ] **Phase 1:** Manual test successful
- [ ] **Phase 2:** BookingForm component
- [ ] **Phase 2:** Booking page
- [ ] **Phase 2:** Confirmation page
- [ ] **Phase 3:** Tests written
- [ ] **Phase 3:** All tests passing
- [ ] **Phase 3:** Security review complete

---

## Questions? Check These Docs

1. **Detailed implementation:** `BOOKING_IMPLEMENTATION_PLAN.md`
2. **Field mapping:** `SABRE_BOOKING_API_MAPPING.md`
3. **Bellhopping form structure:** `BELLHOPPING_BOOKING_PAYLOAD_CAPTURED.md`
4. **Project context:** `CLAUDE.md`

---

## Success Criteria

You're done when:
1. ✅ Discovery test finds working endpoint
2. ✅ Can create booking programmatically
3. ✅ Booking saved to database with confirmation number
4. ✅ User can complete booking via UI
5. ✅ Confirmation page displays all details
6. ✅ No PCI compliance violations
7. ✅ Error handling graceful and informative

---

**Ready?** Run the discovery test now:
```bash
npx ts-node scripts/test-booking-endpoint.ts
```
