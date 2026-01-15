import { getAuthToken, getApiBaseUrl } from './auth';

// ============================================================================
// TYPES - Based on SABRE_BOOKING_API_MAPPING.md
// ============================================================================

export interface BookingContext {
  // From search results
  hotelCode: string;
  hotelName: string;
  chainCode?: string;

  // Room selection
  roomTypeCode: string;
  roomTypeName?: string;
  rateCode: string;

  // Stay details
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;

  // Guest counts
  adults: number;
  children?: number;
  rooms: number;

  // Pricing
  amountBeforeTax: number;
  amountAfterTax: number;
  currencyCode: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    postalCode: string;
    country: string; // ISO 2-letter code
  };
}

export interface PaymentInfo {
  cardholderName: string;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';
  cardNumber: string;
  expirationMonth: string; // "01" - "12"
  expirationYear: string; // "2025"
  cvv: string;
  billingAddress?: {
    line1: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface BookingRequest {
  context: BookingContext;
  guest: GuestInfo;
  payment: PaymentInfo;
  specialRequests?: string;
}

// ============================================================================
// CARD TYPE MAPPING
// ============================================================================

const CARD_TYPE_MAP: Record<string, string> = {
  VISA: 'VI',
  MASTERCARD: 'MC',
  'MASTER CARD': 'MC',
  AMEX: 'AX',
  'AMERICAN EXPRESS': 'AX',
  DISCOVER: 'DS',
  'DISCOVER CARD': 'DS',
  JCB: 'JC',
  'JCB CREDIT CARD': 'JC',
};

function mapCardType(cardType: string): string {
  const mapped = CARD_TYPE_MAP[cardType.toUpperCase()];
  if (!mapped) {
    throw new Error(`Unsupported card type: ${cardType}`);
  }
  return mapped;
}

// ============================================================================
// BUILD SABRE BOOKING REQUEST
// ============================================================================

export function buildBookingRequest(booking: BookingRequest) {
  const { context, guest, payment, specialRequests } = booking;

  // Build guest counts array
  const guestCounts: Array<{ AgeQualifyingCode: string; Count: number }> = [
    { AgeQualifyingCode: '10', Count: context.adults }, // Adults
  ];

  if (context.children && context.children > 0) {
    guestCounts.push({
      AgeQualifyingCode: '8', // Children
      Count: context.children,
    });
  }

  // Map card type
  const cardCode = mapCardType(payment.cardType);

  // Build expiration date in YYYY-MM format
  const expirationDate = `${payment.expirationYear}-${payment.expirationMonth.padStart(2, '0')}`;

  // Use guest address as billing if not provided
  const billingAddress = payment.billingAddress || guest.address;

  if (!billingAddress) {
    throw new Error('Either billing address or guest address must be provided');
  }

  // Build the Sabre request payload
  const sabreRequest = {
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
          GivenName: guest.firstName,
          Surname: guest.lastName,
        },
        ContactInfo: {
          Email: guest.email,
          ...(guest.phone && { Phone: guest.phone }),
        },
        ...(guest.address && {
          Address: {
            AddressLine1: guest.address.line1,
            CityName: guest.address.city,
            PostalCode: guest.address.postalCode,
            CountryCode: guest.address.country,
          },
        }),
      },
      PaymentInfo: {
        PaymentCard: {
          CardCode: cardCode,
          CardNumber: payment.cardNumber,
          ExpirationDate: expirationDate,
          CVV: payment.cvv,
          CardHolderName: payment.cardholderName,
        },
        BillingAddress: {
          AddressLine1: billingAddress.line1,
          CityName: billingAddress.city,
          PostalCode: billingAddress.postalCode,
          CountryCode: billingAddress.country,
        },
      },
      ...(specialRequests && {
        SpecialRequests: {
          SpecialRequest: [
            {
              RequestType: 'GENERAL',
              Text: specialRequests.substring(0, 200), // Limit length
            },
          ],
        },
      }),
    },
  };

  return sabreRequest;
}

// ============================================================================
// MAKE BOOKING API CALL
// ============================================================================

export interface BookingResult {
  success: boolean;
  confirmationNumber?: string;
  sabreLocator?: string;
  propertyConfirmation?: string;
  totalAmount?: number;
  currencyCode?: string;
  error?: string;
  errorDetails?: any;
  rawRequest?: any;
  rawResponse?: any;
}

export async function createBooking(booking: BookingRequest): Promise<BookingResult> {
  try {
    console.log('🏨 Starting hotel booking...');
    console.log('Hotel:', booking.context.hotelCode, booking.context.hotelName);
    console.log('Check-in:', booking.context.checkIn, '→ Check-out:', booking.context.checkOut);

    // Get auth token
    console.log('🔑 Getting Sabre auth token...');
    const token = await getAuthToken();
    console.log('✅ Auth token obtained');

    // Build request
    console.log('📦 Building Sabre booking request...');
    const sabreRequest = buildBookingRequest(booking);
    console.log('Request structure:', JSON.stringify(sabreRequest, null, 2));

    // Make API call
    const baseUrl = getApiBaseUrl();
    // NOTE: /book/hotels (without version) is the ONLY endpoint that works!
    // All versioned endpoints (/v1, /v2, /v2.0.0, /v3) return 403 Forbidden
    const endpoint = `${baseUrl}/book/hotels`;

    console.log('🚀 Calling Sabre booking API:', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sabreRequest),
    });

    console.log('📥 Response status:', response.status);

    // Get response text first to handle empty responses
    const responseText = await response.text();
    console.log('Response text length:', responseText.length);
    console.log('Response text:', responseText || '(empty)');

    let responseData: any = null;
    if (responseText && responseText.length > 0) {
      try {
        responseData = JSON.parse(responseText);
        console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log('⚠️  Response is not JSON:', responseText.substring(0, 200));
      }
    } else {
      console.log('⚠️  Response body is empty');
    }

    if (!response.ok) {
      console.error('❌ Booking failed with status:', response.status);
      return {
        success: false,
        error: `Booking failed: ${response.status} ${response.statusText}`,
        errorDetails: responseData,
        rawRequest: sabreRequest,
        rawResponse: responseData,
      };
    }

    // Parse success response
    // NOTE: Exact response structure needs to be verified with actual API
    const bookingRS = responseData.CreateBookingRS || responseData;

    console.log('✅ Booking successful!');

    return {
      success: true,
      confirmationNumber: bookingRS.BookingRef?.ConfirmationNumber,
      sabreLocator: bookingRS.BookingRef?.SabreLocator,
      propertyConfirmation: bookingRS.BookingRef?.PropertyConfirmation,
      totalAmount: parseFloat(bookingRS.BookingDetails?.TotalAmount || booking.context.amountAfterTax),
      currencyCode: bookingRS.BookingDetails?.CurrencyCode || booking.context.currencyCode,
      rawRequest: sabreRequest,
      rawResponse: responseData,
    };
  } catch (error) {
    console.error('❌ Booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
    };
  }
}
