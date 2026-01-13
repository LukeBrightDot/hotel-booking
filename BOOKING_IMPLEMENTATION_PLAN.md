# Hotel Booking Flow - Complete Implementation Plan
**Created:** 2026-01-13
**Status:** Ready for Execution
**For:** Sonnet 4.5 Terminal Agent

---

## Executive Summary

This plan provides a step-by-step implementation path for the hotel booking flow, including **discovery tests** for unknown payload formats and fallback strategies. The plan is designed to handle uncertainties in Sabre's booking API documentation.

### Critical Unknown Identified

**🚨 ENDPOINT UNCERTAINTY:** The assumed endpoint `POST /v2.0.0/book/hotels` is **NOT documented** in official Sabre REST API docs. The documented booking APIs are:
- `EnhancedHotelBookRQ` (SOAP)
- `OTA_HotelResRQ` (SOAP v2.2.0)
- Booking Management API (REST v1.30)

**Strategy:** Build with discovery tests to identify the correct endpoint and payload format.

---

## Phase 0: Pre-Implementation Discovery

### Goal
Identify the actual Sabre booking endpoint and validate payload format **before** building the full implementation.

### Discovery Test 1: Endpoint Validation

**Objective:** Determine which booking endpoint works with our V2 EPR auth.

**Test File:** `scripts/test-booking-endpoint.ts`

```typescript
import { getAuthToken, getApiBaseUrl } from '@/lib/sabre/auth';

const TEST_ENDPOINTS = [
  '/v2.0.0/book/hotels',           // Assumed endpoint
  '/v1.0.0/book/hotels',           // Alternative version
  '/v2/book/hotels',               // Simplified path
  '/v1/book/passengernamerecord',  // PNR-based
  '/v2.0.0/passenger/records',     // Alternative PNR
];

async function discoverBookingEndpoint() {
  const token = await getAuthToken();
  const baseUrl = getApiBaseUrl();

  console.log('\n🔍 DISCOVERY TEST: Finding booking endpoint...\n');

  for (const endpoint of TEST_ENDPOINTS) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`Testing: ${url}`);

    // Send minimal valid payload
    const testPayload = {
      HotelCode: "TEST",
      // Minimal required fields
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      console.log(`  Status: ${response.status}`);
      console.log(`  Headers:`, response.headers);

      if (response.status !== 404 && response.status !== 403) {
        // Endpoint exists! Parse response
        const text = await response.text();
        console.log(`  ✅ FOUND! Response:`, text.substring(0, 500));
        return { endpoint, status: response.status, response: text };
      }
    } catch (error) {
      console.log(`  ❌ Error:`, error.message);
    }
  }

  console.log('\n❌ No working REST endpoint found. May need SOAP API.');
  return null;
}
```

**Run:**
```bash
npx ts-node scripts/test-booking-endpoint.ts
```

**Expected Outcomes:**
1. **200/201** = Endpoint works, payload needs refinement
2. **400** = Endpoint exists, payload format wrong (good - we can fix)
3. **401/403** = Auth issue (check token)
4. **404** = Endpoint doesn't exist (try next)
5. **All 404** = Must use SOAP API

---

### Discovery Test 2: Payload Format Validation

**Objective:** Once endpoint is found, validate required payload structure.

**Test File:** `scripts/test-booking-payload.ts`

```typescript
// Test different payload structures
const PAYLOAD_FORMATS = [
  // Format 1: Based on mapping doc
  {
    name: 'Mapped Format (JSON)',
    payload: {
      CreateBookingRQ: {
        HotelBookInfo: {
          HotelCode: "390915",
          CodeContext: "SABRE",
          StayDateRange: {
            StartDate: "2026-03-15",
            EndDate: "2026-03-18",
          },
          RoomSelection: {
            RoomTypeCode: "A1K",
            RateCode: "RAC",
            NumRooms: 1,
          },
        },
        GuestInfo: {
          GuestName: {
            GivenName: "TEST",
            Surname: "BOOKING",
          },
          ContactInfo: {
            Email: "test@example.com",
          },
        },
      },
    },
  },

  // Format 2: Simplified structure
  {
    name: 'Simplified Format',
    payload: {
      HotelCode: "390915",
      StartDate: "2026-03-15",
      EndDate: "2026-03-18",
      RoomTypeCode: "A1K",
      RateCode: "RAC",
      GuestFirstName: "TEST",
      GuestLastName: "BOOKING",
      GuestEmail: "test@example.com",
    },
  },

  // Format 3: PNR-based
  {
    name: 'PNR Format',
    payload: {
      CreatePassengerNameRecordRQ: {
        TravelItineraryAddInfo: {
          CustomerInfo: {
            PersonName: {
              GivenName: "TEST",
              Surname: "BOOKING",
            },
          },
        },
        PostBookingRQ: {
          HotelSegment: {
            HotelCode: "390915",
            StartDate: "2026-03-15",
            EndDate: "2026-03-18",
          },
        },
      },
    },
  },
];

async function testPayloadFormats(endpoint: string) {
  const token = await getAuthToken();
  const baseUrl = getApiBaseUrl();

  for (const { name, payload } of PAYLOAD_FORMATS) {
    console.log(`\n🧪 Testing payload: ${name}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.text();

    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${data.substring(0, 300)}`);

    // Parse error messages for clues
    try {
      const json = JSON.parse(data);
      if (json.Errors || json.errors) {
        console.log(`  ℹ️ Errors:`, json.Errors || json.errors);
      }
    } catch (e) {}
  }
}
```

**Analysis of Results:**
- **400 errors** → Look for "missing required field" messages
- **Schema validation errors** → Tells us exactly what's wrong
- **200/201** → Success! Document the working format

---

### Discovery Test 3: Minimal Booking Test

**Objective:** Make an actual test booking with minimal data to validate end-to-end flow.

**Test Card Numbers** (Sabre test environment):
```typescript
const TEST_CARDS = {
  visa: '4111111111111111',
  mastercard: '5500000000000004',
  amex: '340000000000009',
};
```

**Minimal Payload:**
```typescript
const minimalBooking = {
  HotelCode: "390915",  // The Goodtime Hotel from captured data
  StartDate: "2026-02-15",
  EndDate: "2026-02-16",
  RoomTypeCode: "STD",  // Must come from search results
  RateCode: "RAC",      // Must come from search results

  // Guest
  GuestFirstName: "TEST",
  GuestLastName: "BOOKING",
  GuestEmail: "test@example.com",

  // Payment
  CardType: "VI",
  CardNumber: "4111111111111111",
  ExpirationDate: "2027-12",
  CVV: "123",
  CardHolderName: "TEST BOOKING",
};
```

**Success Criteria:**
1. Returns 200/201 status
2. Includes confirmation number
3. No "missing required field" errors

---

## Phase 1: Core Booking Service Implementation

### Step 1.1: Create Booking Types

**File:** `src/types/booking.ts`

```typescript
// Complete TypeScript interfaces based on mapping doc
export interface BookingContext {
  // From search results
  hotelCode: string;
  hotelName: string;
  chainCode?: string;

  // Room selection from search
  roomTypeCode: string;
  roomTypeName: string;
  rateCode: string;

  // Stay details
  checkIn: string;  // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;

  // Guest counts (must match search)
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

export interface BookingFormData {
  // Guest Information
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;

  // Guest Address (REQUIRED by Sabre, NOT collected by bellhopping)
  guestAddress: string;
  guestCity: string;
  guestPostalCode: string;
  guestCountry: string;  // ISO 2-letter code

  // Payment Information
  cardholderFirstName: string;
  cardholderLastName: string;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';
  cardNumber: string;
  expirationMonth: string;  // "01"-"12"
  expirationYear: string;   // "2026"
  cvv: string;

  // Billing Address (optional - use guest address if not provided)
  billingAddress?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Special Requests
  specialRequests?: string;

  // Loyalty (optional)
  loyaltyNumber?: string;

  // Terms
  acceptTerms: boolean;
}

// Sabre API types (adjust based on discovery tests)
export interface SabreBookingRequest {
  CreateBookingRQ: {
    HotelBookInfo: {
      HotelCode: string;
      CodeContext: 'SABRE';
      StayDateRange: {
        StartDate: string;
        EndDate: string;
      };
      RoomSelection: {
        RoomTypeCode: string;
        RateCode: string;
        NumRooms: number;
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
        Phone?: string;
      };
      Address: {
        AddressLine1: string;
        CityName: string;
        PostalCode: string;
        CountryCode: string;
      };
    };
    PaymentInfo: {
      PaymentCard: {
        CardCode: 'VI' | 'MC' | 'AX' | 'DS' | 'JC';
        CardNumber: string;
        ExpirationDate: string;  // YYYY-MM
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
        RequestType: string;
        Text: string;
      }>;
    };
  };
}

export interface SabreBookingResponse {
  CreateBookingRS: {
    ApplicationResults: {
      Success?: Array<{ timeStamp: string }>;
      Error?: Array<{
        SystemSpecificResults?: Array<{ Message: Array<{ content: string }> }>;
      }>;
    };
    BookingRef?: {
      ConfirmationNumber: string;
      SabreLocator: string;
      PropertyConfirmation?: string;
    };
    BookingDetails?: {
      TotalAmount: string;
      CurrencyCode: string;
    };
  };
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  sabreLocator?: string;
  propertyConfirmation?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

### Step 1.2: Create Booking Service

**File:** `src/lib/sabre/booking.ts`

```typescript
import { getAuthToken, getApiBaseUrl } from './auth';
import type {
  BookingContext,
  BookingFormData,
  SabreBookingRequest,
  SabreBookingResponse,
  BookingResult,
} from '@/types/booking';

// Card type mapping: Display name → Sabre code
const CARD_TYPE_MAP: Record<string, string> = {
  'VISA': 'VI',
  'MASTERCARD': 'MC',
  'MASTER CARD': 'MC',
  'AMEX': 'AX',
  'AMERICAN EXPRESS': 'AX',
  'DISCOVER': 'DS',
  'DISCOVER CARD': 'DS',
  'JCB': 'JC',
  'JCB CREDIT CARD': 'JC',
};

function mapCardType(cardType: string): string {
  return CARD_TYPE_MAP[cardType.toUpperCase()] || cardType;
}

/**
 * Build Sabre booking request from form data and context
 */
export function buildBookingRequest(
  context: BookingContext,
  formData: BookingFormData
): SabreBookingRequest {
  // Format expiration date as YYYY-MM
  const expirationDate = `${formData.expirationYear}-${formData.expirationMonth}`;

  // Combine cardholder name
  const cardHolderName = `${formData.cardholderFirstName} ${formData.cardholderLastName}`;

  // Use guest address for billing if not provided
  const billingAddress = formData.billingAddress || formData.guestAddress;
  const billingCity = formData.billingCity || formData.guestCity;
  const billingPostalCode = formData.billingPostalCode || formData.guestPostalCode;
  const billingCountry = formData.billingCountry || formData.guestCountry;

  // Build guest counts from context
  const guestCounts: Array<{ AgeQualifyingCode: '10' | '8' | '7'; Count: number }> = [];
  if (context.adults > 0) {
    guestCounts.push({ AgeQualifyingCode: '10', Count: context.adults });
  }
  if (context.children > 0) {
    guestCounts.push({ AgeQualifyingCode: '8', Count: context.children });
  }

  const request: SabreBookingRequest = {
    CreateBookingRQ: {
      HotelBookInfo: {
        HotelCode: context.hotelCode,
        CodeContext: 'SABRE',
        StayDateRange: {
          StartDate: context.checkIn,
          EndDate: context.checkOut,
        },
        RoomSelection: {
          RoomTypeCode: context.roomTypeCode,
          RateCode: context.rateCode,
          NumRooms: context.rooms,
        },
        GuestCounts: {
          GuestCount: guestCounts,
        },
      },
      GuestInfo: {
        GuestName: {
          GivenName: formData.guestFirstName,
          Surname: formData.guestLastName,
        },
        ContactInfo: {
          Email: formData.guestEmail,
          ...(formData.guestPhone && { Phone: formData.guestPhone }),
        },
        Address: {
          AddressLine1: formData.guestAddress,
          CityName: formData.guestCity,
          PostalCode: formData.guestPostalCode,
          CountryCode: formData.guestCountry,
        },
      },
      PaymentInfo: {
        PaymentCard: {
          CardCode: mapCardType(formData.cardType) as any,
          CardNumber: formData.cardNumber,
          ExpirationDate: expirationDate,
          CVV: formData.cvv,
          CardHolderName: cardHolderName,
        },
        BillingAddress: {
          AddressLine1: billingAddress,
          CityName: billingCity,
          PostalCode: billingPostalCode,
          CountryCode: billingCountry,
        },
      },
    },
  };

  // Add special requests if provided
  if (formData.specialRequests) {
    request.CreateBookingRQ.SpecialRequests = {
      SpecialRequest: [
        {
          RequestType: 'GENERAL',
          Text: formData.specialRequests,
        },
      ],
    };
  }

  return request;
}

/**
 * Parse Sabre booking response
 */
function parseBookingResponse(
  sabreResponse: SabreBookingResponse
): BookingResult {
  const results = sabreResponse.CreateBookingRS.ApplicationResults;

  // Check for errors
  if (results.Error && results.Error.length > 0) {
    const errorMessages = results.Error.flatMap(err =>
      err.SystemSpecificResults?.flatMap(ssr =>
        ssr.Message.map(m => m.content)
      ) || []
    );

    return {
      success: false,
      error: {
        code: 'BOOKING_FAILED',
        message: errorMessages.join('; ') || 'Booking failed',
        details: results.Error,
      },
    };
  }

  // Check for success
  if (results.Success && sabreResponse.CreateBookingRS.BookingRef) {
    const bookingRef = sabreResponse.CreateBookingRS.BookingRef;

    return {
      success: true,
      confirmationNumber: bookingRef.ConfirmationNumber,
      sabreLocator: bookingRef.SabreLocator,
      propertyConfirmation: bookingRef.PropertyConfirmation,
    };
  }

  // Unknown response
  return {
    success: false,
    error: {
      code: 'UNKNOWN_RESPONSE',
      message: 'Unexpected response format from Sabre',
      details: sabreResponse,
    },
  };
}

/**
 * Create hotel booking via Sabre API
 *
 * NOTE: Endpoint may need adjustment based on discovery tests
 */
export async function createBooking(
  context: BookingContext,
  formData: BookingFormData
): Promise<BookingResult> {
  try {
    // Get authentication token
    const token = await getAuthToken();
    const baseUrl = getApiBaseUrl();

    // Build request payload
    const payload = buildBookingRequest(context, formData);

    console.log('📤 Sabre booking request:', JSON.stringify(payload, null, 2));

    // TODO: Update endpoint based on discovery test results
    const endpoint = '/v2.0.0/book/hotels';  // ⚠️ MAY NEED ADJUSTMENT

    // Call Sabre API
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`📥 Sabre booking response: ${response.status}`);

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Booking error:', data);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: `Booking failed with status ${response.status}`,
          details: data,
        },
      };
    }

    console.log('✅ Booking response:', JSON.stringify(data, null, 2));

    // Parse and return result
    return parseBookingResponse(data);

  } catch (error) {
    console.error('❌ Booking exception:', error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
    };
  }
}
```

---

### Step 1.3: Create Booking API Endpoint

**File:** `src/app/api/booking/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/sabre/booking';
import { prisma } from '@/lib/db/prisma';
import type { BookingContext, BookingFormData } from '@/types/booking';

// Validation helpers
function validateBookingContext(context: any): context is BookingContext {
  return (
    context &&
    typeof context.hotelCode === 'string' &&
    typeof context.checkIn === 'string' &&
    typeof context.checkOut === 'string' &&
    typeof context.roomTypeCode === 'string' &&
    typeof context.rateCode === 'string'
  );
}

function validateFormData(data: any): data is BookingFormData {
  return (
    data &&
    typeof data.guestFirstName === 'string' &&
    typeof data.guestLastName === 'string' &&
    typeof data.guestEmail === 'string' &&
    typeof data.guestAddress === 'string' &&
    typeof data.guestCity === 'string' &&
    typeof data.guestPostalCode === 'string' &&
    typeof data.guestCountry === 'string' &&
    typeof data.cardNumber === 'string' &&
    typeof data.cvv === 'string' &&
    data.acceptTerms === true
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, guest, payment, specialRequests } = body;

    // Validate context
    if (!validateBookingContext(context)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTEXT',
            message: 'Invalid booking context',
          },
        },
        { status: 400 }
      );
    }

    // Validate dates
    const checkIn = new Date(context.checkIn);
    const checkOut = new Date(context.checkOut);
    const now = new Date();

    if (checkIn < now) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'Check-in date cannot be in the past',
          },
        },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'Check-out must be after check-in',
          },
        },
        { status: 400 }
      );
    }

    // Build form data
    const formData: BookingFormData = {
      guestFirstName: guest.firstName,
      guestLastName: guest.lastName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      guestAddress: guest.address?.line1 || '',
      guestCity: guest.address?.city || '',
      guestPostalCode: guest.address?.postalCode || '',
      guestCountry: guest.address?.country || '',

      cardholderFirstName: payment.cardholderName?.split(' ')[0] || guest.firstName,
      cardholderLastName: payment.cardholderName?.split(' ').slice(1).join(' ') || guest.lastName,
      cardType: payment.cardType,
      cardNumber: payment.cardNumber,
      expirationMonth: payment.expirationMonth,
      expirationYear: payment.expirationYear,
      cvv: payment.cvv,

      billingAddress: payment.billingAddress?.line1,
      billingCity: payment.billingAddress?.city,
      billingPostalCode: payment.billingAddress?.postalCode,
      billingCountry: payment.billingAddress?.country,

      specialRequests,
      acceptTerms: true,
    };

    // Validate form data
    if (!validateFormData(formData)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FORM_DATA',
            message: 'Missing required booking information',
          },
        },
        { status: 400 }
      );
    }

    // Call Sabre booking API
    const result = await createBooking(context, formData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Save to database
    const booking = await prisma.booking.create({
      data: {
        confirmationNumber: result.confirmationNumber,
        sabreLocator: result.sabreLocator,
        propertyConfirmation: result.propertyConfirmation,

        hotelCode: context.hotelCode,
        hotelName: context.hotelName,
        roomTypeCode: context.roomTypeCode,
        roomTypeName: context.roomTypeName,
        rateCode: context.rateCode,

        checkIn: checkIn,
        checkOut: checkOut,
        nights: context.nights,

        guestFirstName: formData.guestFirstName,
        guestLastName: formData.guestLastName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,

        totalAmount: context.amountAfterTax,
        currencyCode: context.currencyCode,
        priceBreakdown: {
          amountBeforeTax: context.amountBeforeTax,
          amountAfterTax: context.amountAfterTax,
          commission: context.commission,
        },

        status: 'confirmed',
        specialRequests: formData.specialRequests,

        // Store full request/response for debugging
        sabreRequest: body,
        sabreResponse: result,
      },
    });

    // Return success
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationNumber: booking.confirmationNumber,
        sabreLocator: booking.sabreLocator,
        propertyConfirmation: booking.propertyConfirmation,
        hotel: {
          code: booking.hotelCode,
          name: booking.hotelName,
        },
        stay: {
          checkIn: booking.checkIn.toISOString().split('T')[0],
          checkOut: booking.checkOut.toISOString().split('T')[0],
          nights: booking.nights,
        },
        room: {
          type: booking.roomTypeName || booking.roomTypeCode,
          rateCode: booking.rateCode,
        },
        pricing: {
          totalAmount: booking.totalAmount,
          currencyCode: booking.currencyCode,
        },
      },
    });

  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## Phase 2: Frontend Implementation

### Step 2.1: Booking Form Component

**File:** `src/components/BookingForm.tsx`

Key features:
- Guest information section
- **Address fields** (NEW - required by Sabre)
- Payment card section
- "Same as guest address" checkbox for billing
- Form validation with Zod
- Error handling and display
- Loading states

**Dependencies:**
```bash
npm install zod react-hook-form @hookform/resolvers
```

### Step 2.2: Booking Flow Pages

**Files to create:**
1. `src/app/hotels/[code]/booking/page.tsx` - Main booking page
2. `src/app/booking/confirmation/[id]/page.tsx` - Confirmation page

---

## Phase 3: Testing Strategy

### Test Scenario 1: Missing Address Fields

**Hypothesis:** Sabre requires address but bellhopping doesn't collect it.

**Test:**
1. Submit booking WITHOUT guest address
2. Expected: 400 error with "address required" message
3. Confirm: Add address fields to form

### Test Scenario 2: Card Type Mapping

**Test all card types:**
```typescript
const TEST_CASES = [
  { input: 'VISA', expected: 'VI', cardNumber: '4111111111111111' },
  { input: 'MASTERCARD', expected: 'MC', cardNumber: '5500000000000004' },
  { input: 'AMEX', expected: 'AX', cardNumber: '340000000000009' },
];
```

### Test Scenario 3: Date Format Edge Cases

**Test:**
- Same-day booking (check-in today)
- Far future booking (1 year out)
- Single night stay
- Extended stay (30+ nights)

### Test Scenario 4: Guest Count Mismatch

**Test:** Submit booking with guest count different from original search.

**Expected:** Should fail or price should change.

### Test Scenario 5: Rate Expiration

**Test:** Hold search results for 15+ minutes, then try to book.

**Expected:** Rate no longer available error.

---

## Phase 4: Error Handling & Edge Cases

### Common Sabre Error Codes

Document as discovered:

```typescript
export const SABRE_ERROR_CODES = {
  'RATE_UNAVAILABLE': 'Selected rate is no longer available',
  'HOTEL_FULL': 'Hotel is fully booked for selected dates',
  'INVALID_CARD': 'Invalid payment card information',
  'INVALID_DATES': 'Invalid check-in or check-out dates',
  'MISSING_REQUIRED_FIELD': 'Required field missing from request',
  // Add more as discovered
};
```

### Retry Logic

```typescript
async function createBookingWithRetry(
  context: BookingContext,
  formData: BookingFormData,
  maxRetries = 2
): Promise<BookingResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await createBooking(context, formData);

    if (result.success) {
      return result;
    }

    // Retry only on transient errors
    if (
      result.error?.code === 'NETWORK_ERROR' ||
      result.error?.code === 'TIMEOUT'
    ) {
      console.log(`Retry attempt ${attempt}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      continue;
    }

    // Don't retry on validation errors
    return result;
  }

  return {
    success: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: 'Booking failed after multiple attempts',
    },
  };
}
```

---

## Phase 5: Security & Compliance

### PCI Compliance Checklist

**CRITICAL:**
- [ ] NEVER store full card numbers (last 4 digits only)
- [ ] NEVER store CVV (even encrypted)
- [ ] Always use HTTPS for card data transmission
- [ ] Validate card format on frontend AND backend
- [ ] Consider tokenization service (Stripe, Braintree)
- [ ] Log card activity WITHOUT sensitive data
- [ ] Implement rate limiting on booking endpoint
- [ ] Add CAPTCHA to prevent automation
- [ ] Sanitize all error messages (no card data in logs)

### Data Sanitization

```typescript
function sanitizeCardNumber(cardNumber: string): string {
  return `****-****-****-${cardNumber.slice(-4)}`;
}

function sanitizeBookingForLog(booking: any) {
  return {
    ...booking,
    payment: {
      cardType: booking.payment.cardType,
      lastFour: booking.payment.cardNumber.slice(-4),
      // CVV and full number REMOVED
    },
  };
}
```

---

## Phase 6: Fallback Strategies

### If REST API Doesn't Exist

**Option A: SOAP API**
- Use `EnhancedHotelBookRQ` (SOAP)
- Requires XML payload format
- Use `fast-xml-parser` library

**Option B: Proxy Through Bellhopping**
- Not recommended (defeats purpose)
- Only if Sabre API is completely inaccessible

**Option C: Partner Integration**
- Explore other booking providers (Expedia, Booking.com)
- May have REST APIs

---

## Implementation Checklist

### Pre-Implementation (Phase 0)
- [ ] Run endpoint discovery test
- [ ] Run payload format test
- [ ] Document working endpoint and format
- [ ] Create test booking with minimal data

### Core Implementation (Phase 1)
- [ ] Create booking types (`src/types/booking.ts`)
- [ ] Implement booking service (`src/lib/sabre/booking.ts`)
- [ ] Create booking API endpoint (`src/app/api/booking/create/route.ts`)
- [ ] Add database persistence
- [ ] Implement error handling

### Frontend (Phase 2)
- [ ] Create BookingForm component
- [ ] Add address input fields (REQUIRED)
- [ ] Add phone number field (recommended)
- [ ] Implement form validation with Zod
- [ ] Create booking page
- [ ] Create confirmation page
- [ ] Add loading states
- [ ] Add error display

### Testing (Phase 3)
- [ ] Test without address (should fail)
- [ ] Test all card types
- [ ] Test date edge cases
- [ ] Test guest count validation
- [ ] Test rate expiration handling
- [ ] End-to-end booking flow

### Security (Phase 4)
- [ ] Implement PCI compliance measures
- [ ] Add data sanitization
- [ ] Add rate limiting
- [ ] Add CAPTCHA
- [ ] Review error messages for leaks

### Polish (Phase 5)
- [ ] Add email confirmation
- [ ] Add booking history page
- [ ] Add cancellation flow
- [ ] Add modification flow
- [ ] Mobile responsiveness
- [ ] Accessibility review

---

## Success Metrics

### Definition of Done

1. **Discovery Tests Pass**
   - Working endpoint identified
   - Payload format validated
   - Test booking succeeds

2. **Core Flow Works**
   - User can select hotel from search
   - User can fill booking form
   - Form submits to Sabre successfully
   - Confirmation number received
   - Booking saved to database

3. **Error Handling Robust**
   - Invalid card rejected gracefully
   - Rate unavailable handled
   - Form validation clear
   - Network errors retry

4. **Security Compliant**
   - No full card numbers stored
   - No CVV stored
   - All transmission over HTTPS
   - Logs sanitized

---

## Next Steps

**For Sonnet Agent in Terminal:**

1. **START HERE:**
   ```bash
   # Create discovery test script
   mkdir -p scripts
   touch scripts/test-booking-endpoint.ts
   ```

2. **Copy discovery test code** from Phase 0 above

3. **Run discovery tests:**
   ```bash
   npm run dev  # Ensure auth is working
   npx ts-node scripts/test-booking-endpoint.ts
   ```

4. **Document results** in `BOOKING_DISCOVERY_RESULTS.md`

5. **Proceed to Phase 1** once endpoint is confirmed

---

## Questions & Unknowns

Track answers as discovered:

1. **Booking Endpoint:** ❓ What is the actual REST endpoint?
   - Answer: [To be discovered]

2. **Payload Format:** ❓ What is the exact JSON structure?
   - Answer: [To be discovered]

3. **Required Fields:** ❓ Which fields are truly required?
   - Answer: [To be discovered]

4. **Address Requirement:** ❓ Can we omit address?
   - Hypothesis: No, Sabre requires it

5. **Rate Hold:** ❓ How long are rates valid?
   - Hypothesis: 10 minutes (from bellhopping timer)

6. **Multi-Room:** ❓ Does endpoint support multiple rooms?
   - Answer: [To be tested]

---

**Document Status:** ✅ Complete
**Ready for Execution:** Yes (start with Phase 0 Discovery)
**Estimated Complexity:** High (due to unknowns)
**Risk Level:** Medium (discovery tests mitigate risk)

