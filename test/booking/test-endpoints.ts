#!/usr/bin/env tsx

/**
 * Sabre Booking Endpoint Discovery Script
 *
 * This script systematically tests different Sabre booking endpoint variations
 * to find one that works with our account credentials.
 *
 * Run with: npx tsx test/booking/test-endpoints.ts
 */

// Load environment variables FIRST (before any imports that use them)
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first (higher priority), then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_PAYLOAD = {
  CreateBookingRQ: {
    HotelBookInfo: {
      HotelCode: '390915',
      CodeContext: 'SABRE',
      StayDateRange: {
        StartDate: '2026-03-15',
        EndDate: '2026-03-18',
      },
      RoomSelection: {
        RoomTypeCode: 'A1K',
        RateCode: 'RAC',
        NumRooms: 1,
      },
      GuestCounts: {
        GuestCount: [{ AgeQualifyingCode: '10', Count: 2 }],
      },
    },
    GuestInfo: {
      GuestName: {
        GivenName: 'John',
        Surname: 'Smith',
      },
      ContactInfo: {
        Email: 'john.smith.test@example.com',
        Phone: '+1-555-123-4567',
      },
      Address: {
        AddressLine1: '123 Main Street',
        CityName: 'New York',
        PostalCode: '10001',
        CountryCode: 'US',
      },
    },
    PaymentInfo: {
      PaymentCard: {
        CardCode: 'VI',
        CardNumber: '4111111111111111',
        ExpirationDate: '2025-12',
        CVV: '123',
        CardHolderName: 'John Smith',
      },
      BillingAddress: {
        AddressLine1: '123 Main Street',
        CityName: 'New York',
        PostalCode: '10001',
        CountryCode: 'US',
      },
    },
  },
};

// ============================================================================
// ENDPOINT VARIATIONS TO TEST
// ============================================================================

const ENDPOINTS_TO_TEST = [
  // Current attempt
  { endpoint: '/v2.0.0/book/hotels', description: 'V2.0.0 book/hotels (current)' },

  // Version variations
  { endpoint: '/v2/book/hotels', description: 'V2 book/hotels (simplified)' },
  { endpoint: '/v3/book/hotels', description: 'V3 book/hotels' },
  { endpoint: '/v1/book/hotels', description: 'V1 book/hotels' },
  { endpoint: '/book/hotels', description: 'No version prefix' },

  // Different URL structure
  { endpoint: '/v2.0.0/hotels/book', description: 'V2.0.0 hotels/book (reversed)' },
  { endpoint: '/v2/hotels/book', description: 'V2 hotels/book (reversed)' },

  // Reservation endpoints
  { endpoint: '/v2.0.0/book/reservation', description: 'V2.0.0 reservation' },
  { endpoint: '/v2/book/reservation', description: 'V2 reservation' },

  // Hotel reservation
  { endpoint: '/v2.0.0/hotels/reservation', description: 'V2.0.0 hotels/reservation' },
  { endpoint: '/v2/hotels/reservation', description: 'V2 hotels/reservation' },
];

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  endpoint: string;
  description: string;
  status: number;
  success: boolean;
  error?: any;
  response?: any;
}

async function testEndpoint(
  endpoint: string,
  description: string,
  token: string
): Promise<TestResult> {
  const baseUrl = process.env.SABRE_BASE_URL || 'https://api.sabre.com';
  const fullUrl = `${baseUrl}${endpoint}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTING: ${description}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🌐 Full URL: ${fullUrl}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const responseText = await response.text();
    let responseData: any;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`📥 Status: ${response.status} ${response.statusText}`);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ SUCCESS! This endpoint works!');
      console.log('Response:', JSON.stringify(responseData, null, 2));
      return {
        endpoint,
        description,
        status: response.status,
        success: true,
        response: responseData,
      };
    } else if (response.status === 404) {
      console.log('❌ NOT FOUND (404) - Endpoint does not exist');
      console.log('This endpoint is not available in the Sabre API');
    } else if (response.status === 403) {
      console.log('⚠️  FORBIDDEN (403) - Endpoint exists but access denied');
      console.log('Possible reasons:');
      console.log('  - Account lacks booking privileges');
      console.log('  - Different auth method required');
      console.log('  - Incorrect payload structure');
      if (typeof responseData === 'object') {
        console.log('\nError details:', JSON.stringify(responseData, null, 2));
      }
    } else if (response.status === 400) {
      console.log('⚠️  BAD REQUEST (400) - Invalid request format');
      if (typeof responseData === 'object') {
        console.log('Error details:', JSON.stringify(responseData, null, 2));
      }
    } else {
      console.log(`⚠️  UNEXPECTED STATUS: ${response.status}`);
      if (typeof responseData === 'object') {
        console.log('Response:', JSON.stringify(responseData, null, 2));
      } else {
        console.log('Response:', responseData);
      }
    }

    return {
      endpoint,
      description,
      status: response.status,
      success: false,
      error: responseData,
    };
  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    return {
      endpoint,
      description,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n');
  console.log(`${'#'.repeat(80)}`);
  console.log('🔬 SABRE BOOKING ENDPOINT DISCOVERY');
  console.log(`${'#'.repeat(80)}`);
  console.log('\nSystematically testing different endpoint variations...\n');

  // Get auth token (import dynamically after env vars are loaded)
  console.log('🔑 Getting Sabre auth token...');
  const { getAuthToken } = await import('../../src/lib/sabre/auth.js');
  const token = await getAuthToken();
  console.log('✅ Auth token obtained\n');

  // Test all endpoints
  const results: TestResult[] = [];

  for (const config of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(config.endpoint, config.description, token);
    results.push(result);

    // If we found a working endpoint, we can stop early
    if (result.success) {
      console.log('\n🎯 FOUND WORKING ENDPOINT! Stopping tests.\n');
      break;
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n');
  console.log(`${'#'.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'#'.repeat(80)}`);
  console.log('\n');

  const successfulEndpoints = results.filter((r) => r.success);
  const forbiddenEndpoints = results.filter((r) => r.status === 403);
  const notFoundEndpoints = results.filter((r) => r.status === 404);
  const badRequestEndpoints = results.filter((r) => r.status === 400);
  const errorEndpoints = results.filter((r) => r.status === 0);

  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`✅ Successful (200/201): ${successfulEndpoints.length}`);
  console.log(`⚠️  Forbidden (403): ${forbiddenEndpoints.length}`);
  console.log(`❌ Not Found (404): ${notFoundEndpoints.length}`);
  console.log(`⚠️  Bad Request (400): ${badRequestEndpoints.length}`);
  console.log(`❌ Errors: ${errorEndpoints.length}`);
  console.log('\n');

  if (successfulEndpoints.length > 0) {
    console.log('🎯 WORKING ENDPOINTS:');
    successfulEndpoints.forEach((r) => {
      console.log(`  ✅ ${r.endpoint} - ${r.description}`);
    });
    console.log('\n');
  }

  if (forbiddenEndpoints.length > 0) {
    console.log('⚠️  ENDPOINTS THAT EXIST BUT ACCESS DENIED (403):');
    forbiddenEndpoints.forEach((r) => {
      console.log(`  🔒 ${r.endpoint} - ${r.description}`);
    });
    console.log('\n');
    console.log('These endpoints exist but your account does not have permission.');
    console.log('Possible solutions:');
    console.log('  1. Contact Sabre support to enable booking privileges');
    console.log('  2. Use a different auth method for booking');
    console.log('  3. Use PNR-based booking flow instead');
    console.log('\n');
  }

  if (notFoundEndpoints.length > 0) {
    console.log('❌ ENDPOINTS THAT DO NOT EXIST (404):');
    notFoundEndpoints.forEach((r) => {
      console.log(`  ❌ ${r.endpoint} - ${r.description}`);
    });
    console.log('\n');
  }

  console.log(`${'#'.repeat(80)}`);
  console.log('\n');

  // Exit with appropriate code
  if (successfulEndpoints.length > 0) {
    console.log('✅ SUCCESS: Found at least one working endpoint!\n');
    process.exit(0);
  } else if (forbiddenEndpoints.length > 0) {
    console.log('⚠️  PARTIAL: Found endpoints but access denied.\n');
    console.log('Next steps:');
    console.log('  1. Review account permissions with Sabre');
    console.log('  2. Check if different auth credentials needed for booking');
    console.log('  3. Review Sabre documentation for booking requirements\n');
    process.exit(1);
  } else {
    console.log('❌ FAILURE: No valid booking endpoints found.\n');
    console.log('Next steps:');
    console.log('  1. Review Sabre API documentation for correct endpoints');
    console.log('  2. Check if PNR-based booking is required');
    console.log('  3. Verify account has booking API access\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
