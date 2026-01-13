# Bellhopping.com Booking Flow - Captured Payload Data

**Date Captured:** 2026-01-13
**Source:** hotels.bellhopping.com/HotelBook/PriceCheck
**Hotel:** The Goodtime Hotel Miami Beach A Tribute Portfolio Hotel
**Hotel ID:** 390915
**Chain Code:** TX (Tribute Portfolio)

---

## Booking Flow Summary

1. **Search** → `/SearchHotel/HotelSearchResult`
2. **Hotel Details** → `/HotelSearch/HotelDetail?HotelId=390915&ChainCode=TX&...`
3. **Price Check/Booking Form** → `/HotelBook/PriceCheck`
4. **Submit Booking** → **POST to `/HotelBook/HotelBooking`** ⬅️ TARGET ENDPOINT

---

## Form POST Endpoint

**URL:** `https://hotels.bellhopping.com/HotelBook/HotelBooking`
**Method:** `POST`
**Content-Type:** `application/x-www-form-urlencoded` (standard form POST)

---

## Complete Form Field Mapping

### Hotel Information (Hidden Fields)
```
HotelName: "The Goodtime Hotel Miami Beach A Tribute Portfolio Hotel"
HotelChainCode: "TX"
```

### Booking Key (Critical Field)
```
BookingKeyRooms: "1*GUARANTEE*LUMINOUS SUITE OFFER*e6e30729-f542-4e59-aad6-ce559c75115a"
```

**Format Analysis:**
- Field 1: `1` = Number of rooms
- Field 2: `GUARANTEE` = Guarantee type
- Field 3: `LUMINOUS SUITE OFFER` = Rate plan name
- Field 4: `e6e30729-f542-4e59-aad6-ce559c75115a` = Unique rate/session identifier (UUID)

### Commission Fields
```
TotalCommissionRate: "364.00"
CommissionPercent: (not visible but present in form)
```

### Guest Information (Required)
```
FirstName: (required, text)
LastName: (required, text)
LoyaltyNumber: (optional, text)
ConfirmationEmail: (required, email)
```

### Agency/Agent Information (Required Hidden Fields)
```
AgencyName: "Bellhopping"
AgentIATA: "05504844"
AgentName: "Todd Stella"
AgentEmail: "ypo@bellhopping.com"
AgentID: "OA9FUVFL"
CustomerIdentifier: "BELLHOPPIG"
```

### Payment Information (Required)
```
CardFirstName: (required, text)
CardLastName: (required, text)
CardNumber: (required, tel input)
ExpirationMonth: (select dropdown, pre-filled: "01")
ExpirationYear: (select dropdown, pre-filled: "2035")
SecurityCode: (optional, text) - Note: CVV marked as required for prepaid rates
```

**Accepted Card Types:**
- VISA
- MASTER CARD
- AMERICAN EXPRESS
- MASTERCARD
- DISCOVER CARD
- JCB CREDIT CARD

### Additional Fields
```
SpecialInstruction: (optional, text, max 50 chars, no special chars)
Aid: (hidden, base64 encoded identifier)
g-recaptcha-response: (reCAPTCHA token)
__RequestVerificationToken: (CSRF token)
```

---

## Key Observations

### 1. Booking Key Structure
The `BookingKeyRooms` field appears to be the critical link between:
- The search/availability response
- The selected room rate
- The booking submission

**This likely maps to Sabre's:**
- `RoomRateID` or similar identifier from availability response
- Rate plan code
- Guarantee/deposit requirement

### 2. Session/Rate Expiration
- Rate has a 10-minute expiration countdown
- Suggests time-sensitive rate hold or session state

### 3. Agency Context
All bookings include travel agency fields:
- IATA number (05504844)
- Agent ID (OA9FUVFL)
- Agency name (Bellhopping)

**For our implementation:** We need to determine if these are:
- Required by Sabre API
- Bellhopping-specific
- Can be omitted for direct consumer bookings

### 4. Payment Processing
- Form collects credit card but doesn't specify processor
- Likely passes to Sabre for hotel guarantee/deposit
- Need to investigate if Sabre handles tokenization or if card data is passed

---

## Next Steps for Implementation

### Must Investigate:
1. **Sabre Booking API Endpoint** - Which Sabre endpoint does this map to?
   - Likely: `CreatePassengerNameRecordRQ` or `HotelBookRQ`
2. **BookingKeyRooms Format** - How is this generated from search results?
3. **Payment Handling** - Does Sabre require full card details or tokens?
4. **Agency Fields** - Are these required or optional?

### Payload Mapping Needed:
- Map `BookingKeyRooms` → Sabre rate identifier
- Map guest fields → Sabre PNR structure
- Map payment fields → Sabre guarantee/payment structure
- Understand commission fields (TotalCommissionRate)

---

## Sample Booking Request Structure

```typescript
interface BellhoppingBookingPayload {
  // Hotel Info
  HotelName: string;
  HotelChainCode: string;

  // Booking Key (CRITICAL)
  BookingKeyRooms: string; // Format: "rooms*guarantee*rateName*uuid"

  // Commission
  TotalCommissionRate: string;
  CommissionPercent?: string;

  // Guest
  FirstName: string;
  LastName: string;
  LoyaltyNumber?: string;
  ConfirmationEmail: string;

  // Agency
  AgencyName: string;
  AgentIATA: string;
  AgentName: string;
  AgentEmail: string;
  AgentID: string;
  CustomerIdentifier: string;

  // Payment
  CardFirstName: string;
  CardLastName: string;
  CardNumber: string;
  ExpirationMonth: string;
  ExpirationYear: string;
  SecurityCode?: string;

  // Additional
  SpecialInstruction?: string;
  Aid: string; // Session/tracking ID

  // Security
  'g-recaptcha-response': string;
  __RequestVerificationToken: string;
}
```

---

## Questions for Sabre API Mapping

1. What Sabre endpoint handles hotel booking/reservation creation?
2. How do we generate/obtain the equivalent of `BookingKeyRooms`?
3. What's the Sabre structure for guest information in a booking?
4. How does Sabre handle credit card guarantee/payment?
5. Are agency/IATA fields required for Sabre bookings?
6. What's the format of a successful booking response?
