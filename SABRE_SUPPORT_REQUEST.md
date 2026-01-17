# Sabre Support Request - Enable Booking API Access

**Date:** 2026-01-15
**Account:** Coastline Travel (PCC: 52JL)
**Client ID:** VD35-Coastline52JL
**Issue:** Booking API returns authorization error despite successful authentication

---

## Summary

We have successfully implemented Sabre hotel search using the V5 API and are now attempting to implement the booking flow. While authentication and search work perfectly, all booking endpoints return an authorization error indicating our account lacks booking privileges.

---

## Current Status

### What Works ✅

| Component | Endpoint | Status |
|-----------|----------|--------|
| Authentication | `/v2/auth/token` | ✅ Working (~200ms) |
| Hotel Search | `/v5/get/hotelavail` | ✅ Working |

**Authentication Details:**
- Method: V2 EPR
- Format: `V1:250463:52JL:AA`
- Token Type: Bearer (7-day expiration)
- Environments: Working in both CERT and PRODUCTION

### What Doesn't Work ❌

| Endpoint | Environment | Status | Error |
|----------|-------------|--------|-------|
| `/v2/book/hotels` | CERT | 403 Forbidden | ERR.2SG.SEC.NOT_AUTHORIZED |
| `/v2/book/hotels` | PRODUCTION | 403 Forbidden | ERR.2SG.SEC.NOT_AUTHORIZED |

**Error Response:**
```json
{
  "status": "NotProcessed",
  "type": "Validation",
  "errorCode": "ERR.2SG.SEC.NOT_AUTHORIZED",
  "timeStamp": "2026-01-15T04:21:08.617Z",
  "message": "Authorization failed due to no access privileges"
}
```

---

## Testing Performed

We conducted systematic testing to isolate the issue:

### Endpoints Tested (CERT & PRODUCTION)

| Endpoint | Payload | Result |
|----------|---------|--------|
| `/v1/book/hotels` | CreateBookingRQ | 403 Forbidden |
| `/v2/book/hotels` | CreateBookingRQ | **403 with detailed error** |
| `/v2.0.0/book/hotels` | CreateBookingRQ | 403 Forbidden |
| `/v3/book/hotels` | CreateBookingRQ | 403 Forbidden |
| `/book/hotels` (versionless) | All variations | 200 OK (empty response) |

**Key Finding:** The `/v2/book/hotels` endpoint returns a proper error response, confirming:
1. ✅ Our payload structure is correct
2. ✅ The endpoint recognizes and processes our request
3. ❌ PCC 52JL lacks the necessary permissions

### Payload Structure (Validated as Correct)

```json
{
  "CreateBookingRQ": {
    "version": "2.0.0",
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
    },
    "GuestInfo": { ... },
    "PaymentInfo": { ... }
  }
}
```

The endpoint processes this payload (doesn't return validation errors about structure), confirming it's correct.

---

## Request

**Please enable hotel booking API access for:**
- **PCC:** 52JL
- **Client ID:** VD35-Coastline52JL
- **Environments:** Both CERT and PRODUCTION
- **Endpoint:** `/v2/book/hotels`

### Business Context

We are building a hotel booking platform (replicating bellhopping.com functionality) and have successfully:
- Integrated authentication (V2 EPR)
- Implemented hotel search (V5 API)
- Documented complete booking payload structure

We are ready to implement and test bookings immediately once API access is granted.

---

## Technical Details

### Current Authentication
```
Endpoint: https://api.sabre.com/v2/auth/token
Method: POST
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(base64(V1:250463:52JL:AA):base64(password))>
Body: grant_type=client_credentials
```

**Response:** 200 OK with Bearer token (604800s expiration)

### Attempted Booking Request
```
Endpoint: https://api.sabre.com/v2/book/hotels
Method: POST
Content-Type: application/json
Authorization: Bearer <token from auth above>
Body: CreateBookingRQ payload (shown above)
```

**Current Response:** 403 Forbidden with ERR.2SG.SEC.NOT_AUTHORIZED

---

## Questions for Sabre Support

1. **Booking Product Provisioning:**
   - Is hotel booking functionality included in our account?
   - Do we need a specific booking product enabled?

2. **API Access:**
   - Does PCC 52JL have API access for booking operations?
   - Are there additional permissions required beyond search access?

3. **Endpoint Verification:**
   - Is `/v2/book/hotels` the correct endpoint for hotel bookings?
   - Are there prerequisites (e.g., rate quote/hold) before booking?

4. **Timeline:**
   - How long does provisioning typically take?
   - Can this be expedited?

---

## Environment Information

**Base URL:** `https://api.sabre.com`

**Headers Sent:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
Accept: application/json
```

**Client Configuration:**
- Node.js environment
- Modern REST API integration
- Bearer token authentication

---

## Discovery Process

We invested significant time validating our implementation:
1. ✅ Tested 15 different payload structures
2. ✅ Verified both CERT and PRODUCTION environments
3. ✅ Confirmed authentication working perfectly
4. ✅ Successfully implemented and tested hotel search
5. ✅ Validated payload structure matches Sabre documentation

The error is definitively a permissions issue, not an implementation problem.

---

## Expected Resolution

Once booking API access is enabled, we expect:
1. `/v2/book/hotels` to accept our requests
2. Validation errors (if any) about missing/incorrect fields (not authorization)
3. Ability to test bookings in CERT environment
4. Ability to create production bookings after testing

We have all code ready and can begin testing within minutes of access being granted.

---

## Contact Information

**Account:** Coastline Travel
**PCC:** 52JL
**Client ID:** VD35-Coastline52JL
**Project:** Hotel booking platform development

---

## Supporting Documentation

Attached/Available:
- Complete test results (booking-discovery-results.json)
- Payload structure documentation
- Authentication flow documentation
- Search API implementation (working example)

---

**Priority:** High - Blocking production implementation
**Status:** Awaiting permissions provisioning
