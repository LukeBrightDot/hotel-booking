# Bellhopping.com Booking Form Fields Documentation

## Source
- URL: https://hotels.bellhopping.com/HotelBook/PriceCheck
- Date Captured: 2026-01-12
- Flow: Search → Results → Hotel Details → Booking Form

## Form Structure

The booking form is divided into several sections:

### 1. Guest Information Section

#### Fields:
- **First Name*** (required)
  - Type: text
  - Validation: "Special characters such as -!#$%&*1-9 are not permitted."
  - Error message: "Valid first name is required."

- **Last Name*** (required)
  - Type: text
  - Validation: "Special characters such as -!#$%&*1-9 are not permitted."
  - Error message: "Valid last name is required."

- **Loyalty Program Number** (optional)
  - Type: text

### 2. Confirmation Email Section

#### Fields:
- **Email Address*** (required)
  - Type: email
  - Error message: "Valid email address is required."

### 3. Customer/Agency Information Section

#### Fields:
- **Customer Identifier (DK#)** (pre-filled)
  - Type: text
  - Default value on bellhopping: "BELLHOPPIG"

- **Agency Name** (pre-filled)
  - Type: text
  - Default value on bellhopping: "Bellhopping"

- **Agency IATA** (pre-filled)
  - Type: text
  - Default value on bellhopping: "05504844"

- **Agent Name*** (required, pre-filled)
  - Type: text
  - Default value on bellhopping: "Todd Stella"
  - Error message: "Valid agent name is required."

- **Agent Email*** (required, pre-filled)
  - Type: email
  - Default value on bellhopping: "ypo@bellhopping.com"
  - Error message: "Valid agent email is required."

- **Agent ID*** (required, pre-filled)
  - Type: text
  - Default value on bellhopping: "OA9FUVFL"
  - Error message: "Valid agent id is required."

### 4. Billing Information Section

#### Fields:
- **First Name*** (required)
  - Type: text
  - Validation: "Special characters such as -!#$%&*1-9 are not permitted."
  - Error message: "Valid cardholder first name is required."

- **Last Name*** (required)
  - Type: text
  - Validation: "Special characters such as -!#$%&*1-9 are not permitted."
  - Error message: "Valid cardholder last name is required."

- **Accept Credit Card** (label)
  - Accepted card types displayed:
    - VISA
    - MASTER CARD
    - AMERICAN EXPRESS
    - MASTERCARD
    - JCB CREDIT CARD
    - DISCOVER CARD

- **Credit Card Number*** (required)
  - Type: tel
  - Validation: "0-9 Card number only"

- **Expiration Month*** (required)
  - Type: dropdown/combobox
  - Options: 01-12
  - Default: "01"

- **Expiration Year*** (required)
  - Type: dropdown/combobox
  - Options: 2026-2035 (10 years from current)
  - Default: "2026"

- **CVV*** (required)
  - Type: text
  - Error message: "Valid Security Code is required."
  - Note: "*Prepaid Rate Require CVV"

### 5. Special Instructions Section

#### Fields:
- **Special Instruction** (optional)
  - Type: textarea
  - Max length: 50 characters
  - Validation: "Special characters -#$%& are not permitted."

### 6. Hidden/System Fields

- **Aid** (hidden)
  - Value: "r2KwrzwtKpue0KimlObsIA=="
  - Appears to be an affiliate/agent identifier

### 7. Additional UI Elements

- **reCAPTCHA** - "I'm not a robot" checkbox
- **Terms of Use** - Checkbox acknowledgment (text: "By clicking on the button below, I acknowledge that I accept Bellhopping Terms of Use")
- **Rate Expiration Timer** - Shows countdown (e.g., "Rate will expire in: 9m 19s")
- **Submit Button** - "CONFIRM & BOOK" (green button)
- Warning: "Please no double clicking or click book button twice to avoid duplicate bookings."

## Hotel/Booking Context Fields (from URL and form)

From the URL parameters and form context, the following are also captured:

- **HotelId**: 325526
- **ChainCode**: AK
- **CheckInDate**: 01/12/2026
- **CheckOutDate**: 01/13/2026
- **NumberOfAdults**: 2
- **NumberOfChildren**: 0
- **NumberOfRooms**: 1
- **RoomType**: LUMINOUS
- **Total Price**: USD 296.88 (including taxes)

## Key Observations for Implementation

1. **No separate billing address fields** - The form doesn't collect separate billing address (street, city, state, zip)
2. **No phone number field** - No phone number collection visible in the booking form
3. **Agency fields are pre-filled** - The bellhopping site pre-fills agency information
4. **Character validation** - Special characters are restricted in name fields
5. **Rate expiration** - Bookings have a time limit (appears to be ~10 minutes)
6. **Card type detection** - The form displays accepted card types but doesn't appear to have a dropdown selector
7. **Email goes to agent** - The confirmation email section suggests emails go to the agent, not necessarily the guest

## Sabre API Mapping Notes

Based on CLAUDE.md context:
- This is using **Sabre V5 API** for search
- Authentication uses **V2 EPR** format
- The booking payload should match this structure when implementing the replica

## Exact Form Field Names (from DOM inspection)

Complete list of field `name` attributes in the booking form:

1. **HotelName** - Hidden field with hotel name
2. **HotelChainCode** - Hidden field with chain code (e.g., "AK")
3. **BookingKeyRooms** - Select dropdown with format: "1*GUARANTEE*LUMINOUS*{uuid}"
4. **TotalCommissionRate** - Hidden field with base rate
5. **CommissionPercent** - Hidden field for commission percentage
6. **FirstName** - Guest first name (required)
7. **LastName** - Guest last name (required)
8. **LoyaltyNumber** - Guest loyalty program number (optional)
9. **ConfirmationEmail** - Guest email address (required)
10. **CustomerIdentifier** - Customer ID / DK# (pre-filled with "BELLHOPPIG")
11. **AgencyName** - Agency name (pre-filled with "Bellhopping")
12. **AgentIATA** - Agent IATA code (pre-filled with "05504844")
13. **AgentName** - Agent name (required, pre-filled with "Todd Stella")
14. **AgentEmail** - Agent email (required, pre-filled with "ypo@bellhopping.com")
15. **AgentID** - Agent ID (required, pre-filled with "OA9FUVFL")
16. **CardFirstName** - Cardholder first name (required)
17. **CardLastName** - Cardholder last name (required)
18. **CardNumber** - Credit card number (required, type: tel)
19. **ExpirationMonth** - Card expiration month (required, dropdown)
20. **ExpirationYear** - Card expiration year (required, dropdown)
21. **SecurityCode** - CVV/Security code (required)
22. **SpecialInstruction** - Special instructions (optional, max 50 chars)
23. **Aid** - Hidden affiliate/agent identifier
24. **g-recaptcha-response** - reCAPTCHA response token
25. **__RequestVerificationToken** - Anti-CSRF token

### BookingKeyRooms Format
The `BookingKeyRooms` field contains a concatenated string with the format:
```
{NumberOfRooms}*{GuaranteeType}*{RoomType}*{UUID}
```
Example: `"1*GUARANTEE*LUMINOUS*b84819ee-2522-42d8-8eab-c2c5ff5c2d16"`

## Recommended Zod Schema Structure

```typescript
import { z } from 'zod';

// Character validation regex (no special chars except hyphens)
const nameRegex = /^[a-zA-Z\s\-]+$/;

export const bookingFormSchema = z.object({
  // Guest Information
  FirstName: z.string()
    .min(1, "Valid first name is required.")
    .regex(nameRegex, "Special characters such as -!#$%&*1-9 are not permitted."),

  LastName: z.string()
    .min(1, "Valid last name is required.")
    .regex(nameRegex, "Special characters such as -!#$%&*1-9 are not permitted."),

  LoyaltyNumber: z.string().optional(),

  ConfirmationEmail: z.string()
    .email("Valid email address is required."),

  // Agency Information (pre-filled for your implementation)
  CustomerIdentifier: z.string().default("YOUR_CUSTOMER_ID"),
  AgencyName: z.string().default("YOUR_AGENCY_NAME"),
  AgentIATA: z.string().default("YOUR_IATA_CODE"),
  AgentName: z.string().min(1, "Valid agent name is required."),
  AgentEmail: z.string().email("Valid agent email is required."),
  AgentID: z.string().min(1, "Valid agent id is required."),

  // Billing Information
  CardFirstName: z.string()
    .min(1, "Valid cardholder first name is required.")
    .regex(nameRegex, "Special characters such as -!#$%&*1-9 are not permitted."),

  CardLastName: z.string()
    .min(1, "Valid cardholder last name is required.")
    .regex(nameRegex, "Special characters such as -!#$%&*1-9 are not permitted."),

  CardNumber: z.string()
    .regex(/^\d+$/, "0-9 Card number only")
    .min(13)
    .max(19),

  ExpirationMonth: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, "Valid month required (01-12)"),

  ExpirationYear: z.string()
    .regex(/^\d{4}$/, "Valid year required"),

  SecurityCode: z.string()
    .min(3, "Valid Security Code is required.")
    .max(4),

  // Special Instructions
  SpecialInstruction: z.string()
    .max(50, "Max 50 characters")
    .regex(/^[^#$%&]*$/, "Special characters -#$%& are not permitted.")
    .optional(),

  // Hidden/System Fields
  HotelName: z.string(),
  HotelChainCode: z.string(),
  BookingKeyRooms: z.string(), // Format: "1*GUARANTEE*LUMINOUS*{uuid}"
  TotalCommissionRate: z.string(),
  CommissionPercent: z.string().optional(),
  Aid: z.string(),

  // reCAPTCHA
  'g-recaptcha-response': z.string().min(1, "Please complete the reCAPTCHA"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
```

## Next Steps for Implementation

1. Create Zod schema matching these fields (see example above)
2. Implement form validation matching the character restrictions
3. Add rate expiration timer functionality
4. Integrate with Sabre booking API
5. Store booking data in Prisma `Booking` schema
6. Implement reCAPTCHA verification
7. Add Terms of Use acceptance handling
8. Pre-fill agency information fields with your own credentials
9. Implement BookingKeyRooms generation logic
