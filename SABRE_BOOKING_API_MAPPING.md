# Sabre Hotel Booking API Mapping

**Date Created:** 2026-01-13
**Purpose:** Map bellhopping.com booking payload to Sabre API requirements
**Status:** Analysis Complete - Ready for Implementation

---

## Executive Summary

This document maps the captured bellhopping.com booking form structure to Sabre's hotel booking API. Based on analysis of:
- Bellhopping's booking payload (from `BELLHOPPING_BOOKING_PAYLOAD_CAPTURED.md`)
- Sabre API reference documentation
- Existing authentication and search implementations

**Key Finding:** Sabre uses a different booking endpoint (`POST /v2.0.0/book/hotels`) with a structured request format that differs significantly from bellhopping's form-based submission.

---

## Sabre Booking Endpoint

### Primary Endpoint
**URL:** `POST https://api.sabre.com/v2.0.0/book/hotels`
**Authentication:** Bearer token (using existing V2 EPR auth)
**Content-Type:** `application/json`

### Alternative Considerations
The documentation also mentions PNR (Passenger Name Record) based booking, but the hotel-specific endpoint is more appropriate for our use case.

---

## Field Mapping: Bellhopping → Sabre

### 1. Hotel Information

| Bellhopping Field | Value Example | Sabre Field | Sabre Location | Notes |
|-------------------|---------------|-------------|----------------|-------|
| `HotelName` | "The Goodtime Hotel..." | N/A | Not required in booking | Display only |
| `HotelChainCode` | "TX" | `CodeContext` | `HotelBookInfo` | May map to CodeContext |
| N/A | N/A | `HotelCode` | `HotelBookInfo` | **REQUIRED** - From search results |

**Mapping Strategy:**
- Extract `HotelCode` from search results (e.g., "390915")
- Use `CodeContext: "SABRE"` (standard for Sabre hotels)
- Store chain code for display purposes only

---

### 2. Booking Key / Room Selection

**Bellhopping Format:**
```
BookingKeyRooms: "1*GUARANTEE*LUMINOUS SUITE OFFER*e6e30729-f542-4e59-aad6-ce559c75115a"
```

**Parsed Components:**
1. `1` = Number of rooms
2. `GUARANTEE` = Guarantee type
3. `LUMINOUS SUITE OFFER` = Rate plan name
4. `e6e30729-...` = Session/rate identifier (UUID)

**Sabre Equivalent:**

| Component | Sabre Field | Sabre Location | How to Obtain |
|-----------|-------------|----------------|---------------|
| Num Rooms | `NumRooms` | `RoomSelection` | User selection (1-9) |
| Room Type | `RoomTypeCode` | `RoomSelection` | From search result `RoomType[].roomType` |
| Rate Code | `RateCode` | `RoomSelection` | From search result `RoomType[].rateCode` |
| Guarantee | `GuaranteeType` | `PaymentInfo` | From search result `RoomType[].guarantee` |

**Critical Implementation Note:**
- Bellhopping's UUID likely ties to their session/rate hold system
- Sabre requires explicit `RoomTypeCode` and `RateCode` from the search response
- We must store these from the search results when user selects a room
- No equivalent "booking key" - we send structured room selection

**Example Sabre Structure:**
```json
"RoomSelection": {
  "RoomTypeCode": "A1K",
  "RateCode": "RAC",
  "NumRooms": 1
}
```

---

### 3. Date Information

| Bellhopping Field | Value Example | Sabre Field | Sabre Location | Format |
|-------------------|---------------|-------------|----------------|--------|
| Implicit (from search) | "2024-03-15" | `StartDate` | `StayDateRange` | YYYY-MM-DD |
| Implicit (from search) | "2024-03-18" | `EndDate` | `StayDateRange` | YYYY-MM-DD |

**Note:** Dates come from original search parameters, not booking form.

---

### 4. Guest Information

| Bellhopping Field | Value Example | Sabre Field | Sabre Location | Required |
|-------------------|---------------|-------------|----------------|----------|
| `FirstName` | "John" | `GivenName` | `GuestInfo.GuestName` | ✅ Yes |
| `LastName` | "Smith" | `Surname` | `GuestInfo.GuestName` | ✅ Yes |
| `ConfirmationEmail` | "john@email.com" | `Email` | `GuestInfo.ContactInfo` | ✅ Yes |
| N/A (not collected) | "+1-555-123-4567" | `Phone` | `GuestInfo.ContactInfo` | ⚠️ Optional but recommended |
| `LoyaltyNumber` | "123456789" | N/A | Not in standard booking | ⚠️ May need separate API call |

**Missing Fields We Need to Add:**
- Phone number (recommended by Sabre)
- Guest address (required for some bookings)
  - AddressLine1
  - CityName
  - PostalCode
  - CountryCode

**Sabre Structure:**
```json
"GuestInfo": {
  "GuestName": {
    "GivenName": "John",
    "Surname": "Smith"
  },
  "ContactInfo": {
    "Email": "john.smith@email.com",
    "Phone": "+1-555-123-4567"
  },
  "Address": {
    "AddressLine1": "123 Main St",
    "CityName": "New York",
    "PostalCode": "10001",
    "CountryCode": "US"
  }
}
```

---

### 5. Payment Information

| Bellhopping Field | Value Example | Sabre Field | Sabre Location | Notes |
|-------------------|---------------|-------------|----------------|-------|
| `CardFirstName` | "John" | Part of `CardHolderName` | `PaymentInfo.PaymentCard` | Combine with last name |
| `CardLastName` | "Smith" | Part of `CardHolderName` | `PaymentInfo.PaymentCard` | "John Smith" |
| `CardNumber` | "4111111111111111" | `CardNumber` | `PaymentInfo.PaymentCard` | ⚠️ PCI compliance required |
| `ExpirationMonth` | "01" | Part of `ExpirationDate` | `PaymentInfo.PaymentCard` | Format: "YYYY-MM" |
| `ExpirationYear` | "2035" | Part of `ExpirationDate` | `PaymentInfo.PaymentCard` | "2035-01" |
| `SecurityCode` | "123" | `CVV` | `PaymentInfo.PaymentCard` | Required for guarantee |

**Card Type Mapping:**

| Bellhopping | Sabre Code |
|-------------|------------|
| VISA | VI |
| MASTER CARD / MASTERCARD | MC |
| AMERICAN EXPRESS | AX |
| DISCOVER CARD | DS |
| JCB CREDIT CARD | JC |

**Billing Address:**
Sabre requires a billing address. Bellhopping doesn't collect this - we have two options:
1. **Add billing address fields** to our form
2. **Use guest address** as billing address (common practice)

**Sabre Structure:**
```json
"PaymentInfo": {
  "PaymentCard": {
    "CardCode": "VI",
    "CardNumber": "4111111111111111",
    "ExpirationDate": "2025-12",
    "CVV": "123",
    "CardHolderName": "John Smith"
  },
  "BillingAddress": {
    "AddressLine1": "123 Main St",
    "CityName": "New York",
    "PostalCode": "10001",
    "CountryCode": "US"
  }
}
```

---

### 6. Agency Information

**Bellhopping Fields (Hidden):**
```
AgencyName: "Bellhopping"
AgentIATA: "05504844"
AgentName: "Todd Stella"
AgentEmail: "ypo@bellhopping.com"
AgentID: "OA9FUVFL"
CustomerIdentifier: "BELLHOPPIG"
```

**Sabre Requirement Analysis:**
- ❌ **NOT required** in the standard `/v2.0.0/book/hotels` endpoint
- ✅ Agency info is tied to the **authentication credentials** (PCC: 52JL)
- Our V2 EPR authentication already includes agency context: `V1:250463:52JL:AA`
  - `52JL` = PCC (Pseudo City Code) = Our agency identifier
  - This is sufficient for Sabre to track bookings to our agency

**Implementation:**
- No need to include agency fields in booking request
- Authentication context automatically associates booking with our agency
- Commission tracking handled by Sabre based on PCC configuration

---

### 7. Commission Information

**Bellhopping Fields:**
```
TotalCommissionRate: "364.00"
CommissionPercent: (present but not visible)
```

**Sabre Handling:**
- Commission is **returned in search results**, not sent in booking
- Search response includes: `"Commission": { "Percent": "10" }`
- Commission rates are configured at the PCC/agency level in Sabre
- We should **display** commission to user but **not send** in booking request

**Implementation:**
- Store commission from search results
- Calculate commission amount: `(AmountBeforeTax * CommissionPercent) / 100`
- Save to database for reporting
- Not included in booking request payload

---

### 8. Special Requests

| Bellhopping Field | Value Example | Sabre Field | Sabre Location | Notes |
|-------------------|---------------|-------------|----------------|-------|
| `SpecialInstruction` | "Late check-in" | `SpecialRequest` | `SpecialRequests` | Max 50 chars in bellhopping |

**Sabre Structure:**
```json
"SpecialRequests": {
  "SpecialRequest": [
    {
      "RequestType": "GENERAL",
      "Text": "Late check-in expected"
    }
  ]
}
```

**Request Types:**
- `GENERAL` - Generic requests
- `LATE_CHECKOUT` - Late checkout
- `EARLY_CHECKIN` - Early check-in
- `ACCESSIBLE` - Accessibility needs
- `BED_TYPE` - Bed preference
- `SMOKING` - Smoking preference

---

### 9. Guest Count Information

**Bellhopping:** Implicit from search (adults/children count)

**Sabre Requirement:**
```json
"GuestCounts": {
  "GuestCount": [
    { "AgeQualifyingCode": "10", "Count": 2 }
  ]
}
```

**Age Qualifying Codes:**
- `10` = Adult (18+)
- `8` = Child (2-17)
- `7` = Infant (0-2)

**Implementation:**
Pass through from search parameters:
- Adults → `AgeQualifyingCode: "10"`
- Children → `AgeQualifyingCode: "8"`

---

### 10. Security Fields (NOT in Sabre)

**Bellhopping-Specific (NOT mapped):**
- `Aid` - Session tracking ID (bellhopping internal)
- `g-recaptcha-response` - Bot protection (our frontend concern)
- `__RequestVerificationToken` - CSRF protection (our frontend concern)

**Our Implementation:**
- Add our own CSRF protection
- Consider adding rate limiting
- No direct equivalent in Sabre API

---

## Complete Sabre Booking Request

### TypeScript Interface

```typescript
export interface SabreBookingRequest {
  CreateBookingRQ: {
    HotelBookInfo: {
      HotelCode: string;          // From search results
      CodeContext: 'SABRE';       // Always SABRE for our use case
      StayDateRange: {
        StartDate: string;        // YYYY-MM-DD
        EndDate: string;          // YYYY-MM-DD
      };
      RoomSelection: {
        RoomTypeCode: string;     // From search results
        RateCode: string;         // From search results
        NumRooms: number;         // User selection (1-9)
      };
      GuestCounts: {
        GuestCount: Array<{
          AgeQualifyingCode: '10' | '8' | '7';
          Count: number;
        }>;
      };
    };
    GuestInfo: {
      GuestName: {
        GivenName: string;
        Surname: string;
      };
      ContactInfo: {
        Email: string;
        Phone?: string;           // Optional but recommended
      };
      Address?: {                 // Required for some hotels
        AddressLine1: string;
        CityName: string;
        PostalCode: string;
        CountryCode: string;      // ISO 2-letter code
      };
    };
    PaymentInfo: {
      PaymentCard: {
        CardCode: 'VI' | 'MC' | 'AX' | 'DS' | 'JC';
        CardNumber: string;
        ExpirationDate: string;   // YYYY-MM format
        CVV: string;
        CardHolderName: string;
      };
      BillingAddress: {
        AddressLine1: string;
        CityName: string;
        PostalCode: string;
        CountryCode: string;
      };
    };
    SpecialRequests?: {
      SpecialRequest: Array<{
        RequestType: 'GENERAL' | 'LATE_CHECKOUT' | 'EARLY_CHECKIN' | 'ACCESSIBLE' | 'BED_TYPE' | 'SMOKING';
        Text: string;
      }>;
    };
  };
}
```

### Frontend Form Interface (Our UI)

```typescript
export interface BookingFormData {
  // Guest Information
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;

  // Guest Address (optional - use for billing if not provided separately)
  guestAddress?: string;
  guestCity?: string;
  guestPostalCode?: string;
  guestCountry?: string;

  // Payment Information
  cardholderFirstName: string;
  cardholderLastName: string;
  cardNumber: string;
  expirationMonth: string;      // "01" - "12"
  expirationYear: string;       // "2025"
  cvv: string;

  // Billing Address (optional - fallback to guest address)
  billingAddress?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Special Requests
  specialRequests?: string;

  // Loyalty (display only - may need separate API)
  loyaltyNumber?: string;

  // Terms acceptance
  acceptTerms: boolean;
}
```

### Booking Context Interface (From Search)

```typescript
export interface BookingContext {
  // From search results
  hotelCode: string;
  hotelName: string;
  chainCode?: string;

  // Room selection
  roomTypeCode: string;
  roomTypeName: string;
  rateCode: string;

  // Stay details
  checkIn: string;              // YYYY-MM-DD
  checkOut: string;             // YYYY-MM-DD
  nights: number;

  // Guest counts
  adults: number;
  children: number;
  rooms: number;

  // Pricing
  amountBeforeTax: number;
  amountAfterTax: number;
  currencyCode: string;
  commission?: {
    percent: number;
    amount: number;
  };

  // Policies
  guaranteeType?: string;
  cancellationPolicy?: string;
}
```

---

## Sabre Booking Response

### Success Response

```typescript
export interface SabreBookingResponse {
  CreateBookingRS: {
    ApplicationResults: {
      Success: Array<{
        timeStamp: string;
      }>;
    };
    BookingRef: {
      ConfirmationNumber: string;      // Our confirmation number
      SabreLocator: string;            // Sabre PNR locator (6 chars)
      PropertyConfirmation: string;    // Hotel's confirmation number
    };
    BookingDetails: {
      TotalAmount: string;
      CurrencyCode: string;
      RoomStays: {
        RoomStay: Array<{
          RoomTypeCode: string;
          RatePlanCode: string;
          CheckInDate: string;
          CheckOutDate: string;
        }>;
      };
    };
  };
}
```

### Key Response Fields

| Field | Description | Usage |
|-------|-------------|-------|
| `ConfirmationNumber` | Our booking reference | Display to user, store in DB |
| `SabreLocator` | Sabre PNR code | For modifications/cancellations |
| `PropertyConfirmation` | Hotel's confirmation | Give to user for check-in |

---

## Implementation Checklist

### Phase 1: Data Collection Enhancement

- [ ] **Add guest address fields** to booking form
  - [ ] Address line
  - [ ] City
  - [ ] Postal/ZIP code
  - [ ] Country dropdown (ISO codes)

- [ ] **Add phone number field** (recommended)
  - [ ] Format validation
  - [ ] International format support

- [ ] **Add billing address section** (optional checkbox)
  - [ ] "Same as guest address" checkbox
  - [ ] Conditional display of billing fields

- [ ] **Update card type dropdown**
  - [ ] Map display names to Sabre codes
  - [ ] VI, MC, AX, DS, JC

### Phase 2: Booking Context Management

- [ ] **Store room selection in state/session**
  - [ ] HotelCode
  - [ ] RoomTypeCode
  - [ ] RateCode
  - [ ] All pricing details
  - [ ] Commission info

- [ ] **Validate booking context before form display**
  - [ ] Ensure all required fields from search exist
  - [ ] Check rate hasn't expired (10-min timer from bellhopping)

- [ ] **Implement rate re-check** (optional but recommended)
  - [ ] Call rate details API before booking
  - [ ] Warn user if price changed

### Phase 3: API Implementation

- [ ] **Create booking service** (`src/lib/sabre/booking.ts`)
  - [ ] Build Sabre request from form + context
  - [ ] Map card types to Sabre codes
  - [ ] Format dates correctly
  - [ ] Handle guest counts

- [ ] **Create booking API endpoint** (`src/app/api/booking/create/route.ts`)
  - [ ] Validate form data
  - [ ] Authenticate with Sabre
  - [ ] Call booking service
  - [ ] Handle errors
  - [ ] Store booking in database

- [ ] **Add error handling**
  - [ ] Invalid card
  - [ ] Rate no longer available
  - [ ] Hotel fully booked
  - [ ] Validation errors

### Phase 4: Database Integration

- [ ] **Save booking to Prisma** (`Booking` model already exists)
  - [ ] All guest details
  - [ ] Payment info (last 4 digits only!)
  - [ ] Sabre locator
  - [ ] Property confirmation
  - [ ] Full request/response JSON

- [ ] **PCI Compliance**
  - [ ] NEVER store full card number
  - [ ] NEVER store CVV
  - [ ] Consider tokenization service
  - [ ] Store only: card type, last 4, expiry

### Phase 5: Confirmation Flow

- [ ] **Booking confirmation page**
  - [ ] Display all confirmation numbers
  - [ ] Show booking details
  - [ ] Email confirmation option
  - [ ] Print/PDF receipt

- [ ] **Email notification** (optional)
  - [ ] Send confirmation email
  - [ ] Include all confirmation numbers
  - [ ] Add calendar invite (ICS file)

---

## Critical Implementation Notes

### 1. Rate Hold / Session Management

**Bellhopping Observation:**
- 10-minute countdown timer on booking form
- UUID in BookingKeyRooms suggests rate hold

**Sabre Reality:**
- Sabre doesn't have built-in rate holds in standard API
- Rates can change between search and booking
- Hotels may sell out

**Recommended Approach:**
1. **Display rate validity warning**: "Rates are subject to availability"
2. **Optional: Rate re-check** before booking submission
3. **Handle booking failures gracefully**: If rate changed/unavailable, redirect to search
4. **Consider implementing session timer** (bellhopping-style) to manage user expectations

### 2. PCI Compliance for Card Data

**CRITICAL SECURITY REQUIREMENTS:**

1. **NEVER store full card numbers**
   - Store only last 4 digits for display
   - Store card type (VI, MC, etc.)

2. **NEVER store CVV** - Even encrypted

3. **Use HTTPS everywhere** - Non-negotiable

4. **Consider tokenization**:
   - Use Stripe/Braintree to tokenize cards
   - Send tokens to Sabre instead of raw card data
   - Check if Sabre supports payment tokens

5. **Validate on frontend AND backend**
   - Card number format (Luhn algorithm)
   - Expiration date (not expired)
   - CVV format (3-4 digits)

### 3. Address Collection Strategy

**Option A: Required for All** (Safest)
- Collect guest address and billing address always
- Use guest address as billing default
- Checkbox: "Billing same as guest"

**Option B: Optional with Fallback** (Better UX)
- Make address optional initially
- If Sabre booking fails due to missing address, prompt for it
- May require two-step booking process

**Recommendation:** Option A for v1 (simpler, more reliable)

### 4. Commission Handling

**Bellhopping shows commission prominently** - This is an OTA/agency feature

**For our implementation:**
- Commission is in search results: `RoomType[].commission`
- Calculate: `commissionAmount = (amountBeforeTax * commissionPercent) / 100`
- Store in database for reporting
- Decide if/how to display to end users (not typical for consumer-facing)
- **DO NOT** include in booking request (Sabre handles via PCC config)

### 5. Guest Count Edge Cases

**Important:** Guest counts must match between search and booking

```typescript
// From search params
const searchAdults = 2;
const searchChildren = 1;

// In booking request
"GuestCounts": {
  "GuestCount": [
    { "AgeQualifyingCode": "10", "Count": 2 },  // Adults
    { "AgeQualifyingCode": "8", "Count": 1 }    // Children
  ]
}
```

**Validation:**
- Ensure counts match original search
- Don't allow changing guest count during booking
- If user wants different count, redirect to new search

### 6. Multi-Room Bookings

**Bellhopping:** `BookingKeyRooms: "1*..."`  indicates 1 room

**Sabre:** `NumRooms: 1` in RoomSelection

**For multiple rooms:**
- Each room may need separate guest information
- Sabre v2.0.0 booking API may require multiple booking calls
- Alternative: Use array of RoomStay elements (check API docs)
- **Recommendation:** Start with single room (NumRooms: 1) for v1

### 7. Special Requests Handling

**Bellhopping:** Single text field, max 50 chars

**Sabre:** Array of structured requests

**Implementation options:**

**Option A: Simple** (Match bellhopping)
```typescript
// User enters: "Late check-in, high floor"
// We send:
"SpecialRequests": {
  "SpecialRequest": [
    { "RequestType": "GENERAL", "Text": "Late check-in, high floor" }
  ]
}
```

**Option B: Structured** (Better for Sabre)
- Provide checkboxes for common requests
- Map to specific RequestType values
- Include free-text field for additional notes

**Recommendation:** Option A for v1, Option B for v2

### 8. Loyalty Number Handling

**Bellhopping collects:** `LoyaltyNumber` field

**Sabre API:** Not in standard CreateBookingRQ

**Possible solutions:**
1. **Ignore for v1** - Most bookings don't use loyalty
2. **Add to SpecialRequest** - Include as text: "Loyalty #: 123456"
3. **Research separate API** - Sabre may have loyalty profile endpoints
4. **Hotel-specific** - Some chains may accept in special requests

**Recommendation:** Option 2 (special request) for v1

---

## API Endpoint Specification

### POST /api/booking/create

**Request Body:**
```typescript
{
  // Booking context (from session/state)
  context: BookingContext;

  // Form data
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      city: string;
      postalCode: string;
      country: string;  // ISO 2-letter code
    };
  };

  payment: {
    cardholderName: string;  // "First Last"
    cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    billingAddress?: {
      line1: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };

  specialRequests?: string;
}
```

**Success Response:**
```typescript
{
  success: true;
  booking: {
    id: string;                    // Our database ID
    confirmationNumber: string;    // Sabre confirmation
    sabreLocator: string;          // PNR locator
    propertyConfirmation: string;  // Hotel confirmation

    // Booking details
    hotel: {
      code: string;
      name: string;
    };
    stay: {
      checkIn: string;
      checkOut: string;
      nights: number;
    };
    room: {
      type: string;
      rateCode: string;
    };
    pricing: {
      totalAmount: number;
      currencyCode: string;
    };
  };
}
```

**Error Response:**
```typescript
{
  success: false;
  error: {
    code: string;  // 'VALIDATION_FAILED', 'RATE_UNAVAILABLE', 'BOOKING_FAILED'
    message: string;
    details?: any;
  };
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Card type mapping (display name → Sabre code)
- [ ] Date formatting (YYYY-MM-DD)
- [ ] Expiration date formatting (YYYY-MM)
- [ ] Guest count object building
- [ ] Address validation

### Integration Tests
- [ ] End-to-end booking with test cards
- [ ] Error handling (invalid card, unavailable rate)
- [ ] Database storage verification
- [ ] Response parsing

### Test Scenarios
1. **Happy Path**: Complete booking with all fields
2. **Minimal Data**: Only required fields
3. **With Special Requests**: Test request handling
4. **Invalid Card**: Test error handling
5. **Rate Changed**: Test availability error
6. **Multiple Rooms**: Test if supported
7. **International Guest**: Non-US address/phone

### Test Data (Cert Environment)
```typescript
const TEST_CARDS = {
  visa: {
    number: '4111111111111111',
    cvv: '123',
    expiry: '2025-12'
  },
  mastercard: {
    number: '5500000000000004',
    cvv: '123',
    expiry: '2025-12'
  },
  amex: {
    number: '340000000000009',
    cvv: '1234',  // 4 digits for Amex
    expiry: '2025-12'
  }
};
```

---

## Missing Information / Research Needed

### Questions for Sabre Documentation
1. **Rate hold mechanism**: Does Sabre support rate holds between search and booking?
2. **Multi-room booking**: Does v2.0.0 endpoint support multiple rooms in one request?
3. **Loyalty integration**: Separate API for loyalty numbers?
4. **Modification API**: How to modify existing bookings?
5. **Cancellation flow**: Full cancellation endpoint details
6. **Payment tokenization**: Does Sabre accept tokenized cards?

### Additional Files to Review
- [ ] Sabre CreatePassengerNameRecordRQ documentation (if available)
- [ ] Hotel booking v3.0.0 endpoint differences
- [ ] Sabre error code reference
- [ ] PCI compliance guide for Sabre integration

---

## Next Steps

1. **Review this mapping** with team/stakeholders
2. **Decide on address collection strategy** (required vs optional)
3. **Design booking form UI** matching required fields
4. **Implement booking service** (`src/lib/sabre/booking.ts`)
5. **Create API endpoint** (`src/app/api/booking/create/route.ts`)
6. **Add database persistence**
7. **Build confirmation page**
8. **Test with Sabre cert environment**
9. **Implement error handling and retry logic**
10. **PCI compliance review** before production

---

## Summary Table: Key Differences

| Aspect | Bellhopping | Sabre | Implementation Impact |
|--------|-------------|-------|----------------------|
| **Endpoint** | Form POST | REST JSON | Convert form → JSON |
| **Booking Key** | UUID-based | Code-based | Extract codes from search |
| **Agency Info** | Explicit fields | Auth context | No action needed |
| **Commission** | Sent in form | From search | Store, don't send |
| **Address** | Not collected | Required | Add form fields |
| **Phone** | Not collected | Recommended | Add form field |
| **Billing Address** | Not collected | Required | Add or use guest address |
| **Session** | 10-min timer | No hold | Add warning/re-check |
| **Card Data** | Direct | Direct | PCI compliance critical |

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Yes
**Estimated Complexity:** Medium-High (PCI compliance is the main challenge)

