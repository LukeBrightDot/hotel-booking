# Sabre Booking API - Payload Discovery Plan

**Date:** 2026-01-15
**Status:** Ready for Execution
**Target:** Discover correct payload structure for `/book/hotels` endpoint

---

## Executive Summary

The versionless `/book/hotels` endpoint returns `200 OK` with an **empty body**, indicating the payload structure is incorrect. This is similar to the authentication discovery process that took 100+ tests to find the correct `V1:USER:PCC:DOMAIN` format.

**Key Insight:** The Sabre search API uses a specific wrapper pattern (`GetHotelAvailRQ`/`GetHotelAvailRS`). The booking API almost certainly follows the same pattern, but we don't know the exact wrapper name.

---

## Current State

### What We Know Works
| Component | Format | Status |
|-----------|--------|--------|
| Authentication | V2 EPR: `V1:250463:52JL:AA` | ✅ Working (~200ms) |
| Search | `GetHotelAvailRQ` wrapper, V5 API | ✅ Working |
| Booking | Unknown | ❌ Empty response |

### Endpoint Behavior (Tested 2026-01-15)
| Endpoint | Status | Response |
|----------|--------|----------|
| `/v1/book/hotels` | 403 | Forbidden |
| `/v2/book/hotels` | 403 | Forbidden |
| `/v2.0.0/book/hotels` | 403 | Forbidden |
| `/v3/book/hotels` | 403 | Forbidden |
| `/book/hotels` | **200** | **Empty body** |

The `200 OK` with empty body strongly suggests:
1. The endpoint is accessible (authentication works)
2. The payload structure is wrong (not being processed)

---

## Test Plan: 15 Prioritized Payload Variations

### Success Criteria
**Any of these counts as success:**
- Non-empty response body
- Validation error message (tells us expected fields!)
- HTTP error with meaningful message
- Any indication the payload was processed

---

## TIER 1: HIGH PRIORITY (Tests 1-5)

These are most likely to work based on observed Sabre patterns.

### Test 1: CreateBookingRQ Wrapper (Minimal)

**Hypothesis:** Sabre uses `*RQ` suffix for all request wrappers (matching `GetHotelAvailRQ`)

**Payload:**
```json
{
  "CreateBookingRQ": {
    "version": "2.0.0"
  }
}
```

**Expected Outcome:**
- If correct wrapper: Validation error listing required fields
- If wrong: Empty response continues

**What It Proves:** Whether `CreateBookingRQ` is the correct wrapper name

---

### Test 2: HotelBookRQ Wrapper (Minimal)

**Hypothesis:** Hotel-specific endpoints may use `HotelBookRQ` naming

**Payload:**
```json
{
  "HotelBookRQ": {
    "version": "2.0.0"
  }
}
```

**Expected Outcome:**
- Validation error if this is the correct wrapper
- May reveal required child elements in error message

**What It Proves:** Alternative wrapper naming convention

---

### Test 3: OTA_HotelResRQ Wrapper (OTA Standard)

**Hypothesis:** Sabre's SOAP heritage means they may use Open Travel Alliance naming

**Payload:**
```json
{
  "OTA_HotelResRQ": {
    "Version": "2.0"
  }
}
```

**Expected Outcome:**
- If Sabre uses OTA internally, we'll get a validation error
- Note PascalCase `Version` matching OTA spec

**What It Proves:** Whether Sabre uses OTA-standard naming internally

---

### Test 4: EnhancedHotelBookRQ (Enhanced Pattern)

**Hypothesis:** Some Sabre APIs use "Enhanced" prefix (e.g., EnhancedAirBookRQ)

**Payload:**
```json
{
  "EnhancedHotelBookRQ": {
    "version": "2.0.0"
  }
}
```

**Expected Outcome:**
- Validation error if "Enhanced" variant exists

**What It Proves:** Whether an enhanced booking API is available

---

### Test 5: CreateBookingRQ with HotelBookInfo

**Hypothesis:** Our mapping document (SABRE_BOOKING_API_MAPPING.md) has the correct nested structure

**Payload:**
```json
{
  "CreateBookingRQ": {
    "HotelBookInfo": {
      "HotelCode": "325913",
      "CodeContext": "SABRE",
      "StayDateRange": {
        "StartDate": "2026-01-25",
        "EndDate": "2026-01-27"
      },
      "RoomSelection": {
        "RoomTypeCode": "A1K",
        "RateCode": "RAC",
        "NumRooms": 1
      }
    }
  }
}
```

**Expected Outcome:**
- If structure is close: Error about missing guest/payment info
- May proceed further than minimal payloads

**What It Proves:** Whether our documented structure is on the right track

---

## TIER 2: MEDIUM PRIORITY (Tests 6-10)

Alternative patterns and variations.

### Test 6: Flat Structure (No Wrapper)

**Hypothesis:** Modern REST APIs may skip the wrapper pattern

**Payload:**
```json
{
  "hotelCode": "325913",
  "checkIn": "2026-01-25",
  "checkOut": "2026-01-27"
}
```

**Expected Outcome:**
- Likely empty response (Sabre prefers wrapped payloads)

**What It Proves:** Whether unwrapped payloads work at all

---

### Test 7: HotelReservation Root Element

**Hypothesis:** Industry-standard naming for reservations

**Payload:**
```json
{
  "HotelReservation": {
    "HotelCode": "325913",
    "StartDate": "2026-01-25",
    "EndDate": "2026-01-27"
  }
}
```

**Expected Outcome:**
- May work if Sabre uses generic reservation naming

**What It Proves:** Whether generic reservation naming is supported

---

### Test 8: PassengerNameRecord Pattern

**Hypothesis:** Sabre's GDS heritage may require PNR-style structure

**Payload:**
```json
{
  "CreatePNR_RQ": {
    "HotelSegment": {
      "HotelCode": "325913"
    }
  }
}
```

**Expected Outcome:**
- If Sabre requires PNR context, this may get a response

**What It Proves:** Whether booking requires PNR creation context

---

### Test 9: Version at Root Level

**Hypothesis:** Version may need to be at root, not nested in wrapper

**Payload:**
```json
{
  "version": "2.0.0",
  "request": {
    "hotelCode": "325913"
  }
}
```

**Expected Outcome:**
- Test alternative structure where version is outside wrapper

**What It Proves:** Whether version placement affects parsing

---

### Test 10: Form-Encoded (Like Auth)

**Hypothesis:** Some Sabre endpoints prefer form encoding over JSON

**Content-Type:** `application/x-www-form-urlencoded`

**Payload:**
```
HotelCode=325913&CheckIn=2026-01-25&CheckOut=2026-01-27
```

**Expected Outcome:**
- May reveal if endpoint expects different content type

**What It Proves:** Whether form encoding is accepted

---

## TIER 3: LOW PRIORITY (Tests 11-15)

Edge cases and exploratory tests.

### Test 11: Empty Object (Echo Test)

**Payload:**
```json
{}
```

**Expected Outcome:**
- May return different empty response or generic error
- Baseline for comparison

**What It Proves:** Endpoint behavior with no payload

---

### Test 12: BookingRequest Generic

**Payload:**
```json
{
  "BookingRequest": {
    "hotelId": "325913",
    "dates": {
      "start": "2026-01-25",
      "end": "2026-01-27"
    }
  }
}
```

**Expected Outcome:**
- Tests modern REST-style naming

**What It Proves:** Whether generic naming works

---

### Test 13: SABRE_HotelBookRQ (Prefixed)

**Payload:**
```json
{
  "SABRE_HotelBookRQ": {
    "HotelCode": "325913"
  }
}
```

**Expected Outcome:**
- Tests SABRE_ prefix convention

**What It Proves:** Internal naming conventions

---

### Test 14: V2 Versioned Endpoint with Correct Payload

**Endpoint:** `/v2/book/hotels` (returns 403, but may be payload-dependent)

**Payload:**
```json
{
  "CreateBookingRQ": {
    "version": "2.0.0",
    "HotelBookInfo": {
      "HotelCode": "325913"
    }
  }
}
```

**Expected Outcome:**
- 403 may be payload-dependent
- Correct payload might get through

**What It Proves:** Whether versioned endpoints work with correct payload

---

### Test 15: XML Content-Type with JSON

**Content-Type:** `application/xml`
**Body:** JSON payload

**Payload:**
```json
{
  "CreateBookingRQ": {
    "HotelCode": "325913"
  }
}
```

**Expected Outcome:**
- Tests content negotiation
- May reveal if endpoint expects XML

**What It Proves:** Content-type sensitivity

---

## Running the Tests

### Quick Start
```bash
cd hotel-booking
npx ts-node scripts/booking-payload-discovery.ts
```

### Prerequisites
- Node.js 18+
- Environment variables configured (SABRE_EPR_USER, etc.)
- Recent search results for valid hotel/rate codes

### Output
- Console output with real-time results
- `booking-discovery-results.json` with full details

---

## Interpretation Guide

### If All Tests Return Empty 200:
1. **Try additional wrapper names:** SearchBookingRQ, ReserveHotelRQ, etc.
2. **Check if rate hold is required:** May need to call a "quote" or "hold" endpoint first
3. **Verify auth scope:** Booking may require different authentication grant
4. **Test XML payloads:** Sabre may require actual XML, not JSON

### If We Get Validation Errors:
1. **Parse the error message** - It will tell us required fields
2. **Add fields incrementally** - Don't guess, add one at a time
3. **Match field naming exactly** - Case and spelling matter

### If We Get 403 with Message:
1. **Check for scope requirements** - May need different token scope
2. **Verify PCC authorization** - 52JL may not have booking rights
3. **Check rate-level restrictions** - Some rates may not be bookable

---

## Additional Test Ideas (If Needed)

### Phase 2 Tests (if Phase 1 fails)
| Test | Description |
|------|-------------|
| RateQuoteRQ | Test if rate quote step is required first |
| ValidateBookingRQ | Test validation endpoint |
| GET /book/hotels | Check if GET reveals expected structure |
| OPTIONS /book/hotels | Check CORS/allowed methods |
| Head with X-Sabre-Version | Test version header instead of body |

### XML Payload Tests
```xml
<?xml version="1.0"?>
<CreateBookingRQ>
  <HotelCode>325913</HotelCode>
</CreateBookingRQ>
```

### SOAP Envelope Test
```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="...">
  <soap:Body>
    <CreateBookingRQ>...</CreateBookingRQ>
  </soap:Body>
</soap:Envelope>
```

---

## Expected Timeline

1. **Run Tier 1 tests** (5 tests) - 5 minutes
2. **Analyze results** - 5 minutes
3. **If breakthrough:** Iterate on successful structure
4. **If no breakthrough:** Run Tier 2 and 3
5. **Document findings** - Update this doc

**Total time estimate:** 30-60 minutes for full discovery

---

## After Discovery

Once we find the correct payload structure:

1. **Document in SABRE_BOOKING_API_MAPPING.md** - Update with correct wrapper/fields
2. **Implement booking service** - `src/lib/sabre/booking.ts`
3. **Create API endpoint** - `src/app/api/booking/create/route.ts`
4. **Update booking form** - Add missing fields (address, phone)
5. **Test end-to-end** - With cert environment test cards

---

## References

- `SABRE_BOOKING_API_MAPPING.md` - Current field mapping (structure may need update)
- `BELLHOPPING_BOOKING_PAYLOAD_CAPTURED.md` - Bellhopping's form fields
- `AUTHENTICATION_FIXED.md` - Working auth for reference
- `src/lib/sabre/search.ts` - Working search API pattern

---

**Document Status:** Ready for execution
**Next Action:** Run `npx ts-node scripts/booking-payload-discovery.ts`
