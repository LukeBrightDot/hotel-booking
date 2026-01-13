/**
 * Booking Endpoint Discovery Test
 *
 * Purpose: Identify the actual Sabre booking endpoint and validate payload format
 * Run: npx ts-node scripts/test-booking-endpoint.ts
 */

import { getAuthToken, getApiBaseUrl } from '../src/lib/sabre/auth';

// Test endpoints to try
const TEST_ENDPOINTS = [
  '/v2.0.0/book/hotels',           // Assumed from mapping doc
  '/v1.0.0/book/hotels',           // Alternative version
  '/v2/book/hotels',               // Simplified path
  '/v3/book/hotels',               // V3 endpoint
  '/v1/book/passengernamerecord',  // PNR-based
  '/v2.0.0/passenger/records',     // Alternative PNR
  '/v2.0.0/passenger/records/hotel', // PNR + hotel
];

// Minimal test payload
const MINIMAL_PAYLOAD = {
  HotelCode: "390915",  // The Goodtime Hotel from captured data
  StartDate: "2026-03-15",
  EndDate: "2026-03-18",
  GuestFirstName: "TEST",
  GuestLastName: "BOOKING",
  GuestEmail: "test@example.com",
};

// Complete structured payload (based on mapping doc)
const STRUCTURED_PAYLOAD = {
  CreateBookingRQ: {
    HotelBookInfo: {
      HotelCode: "390915",
      CodeContext: "SABRE",
      StayDateRange: {
        StartDate: "2026-03-15",
        EndDate: "2026-03-18",
      },
      RoomSelection: {
        RoomTypeCode: "STD",
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
};

async function discoverBookingEndpoint() {
  console.log('\n🔍 BOOKING ENDPOINT DISCOVERY TEST\n');
  console.log('=' . repeat(60));

  try {
    // Get authentication token
    const token = await getAuthToken();
    const baseUrl = getApiBaseUrl();

    console.log(`✅ Auth token obtained`);
    console.log(`🌐 Base URL: ${baseUrl}\n`);

    const results: Array<{
      endpoint: string;
      status: number;
      exists: boolean;
      response: string;
      payload: 'minimal' | 'structured';
    }> = [];

    // Test each endpoint with both payloads
    for (const endpoint of TEST_ENDPOINTS) {
      console.log(`\n📍 Testing: ${endpoint}`);
      console.log('-'.repeat(60));

      // Try with minimal payload first
      await testEndpointWithPayload(
        `${baseUrl}${endpoint}`,
        MINIMAL_PAYLOAD,
        'minimal',
        token,
        results,
        endpoint
      );

      // If minimal failed with 400 (not 404), try structured
      const lastResult = results[results.length - 1];
      if (lastResult && lastResult.status === 400) {
        console.log(`   ⚠️ 400 error - trying structured payload...`);
        await testEndpointWithPayload(
          `${baseUrl}${endpoint}`,
          STRUCTURED_PAYLOAD,
          'structured',
          token,
          results,
          endpoint
        );
      }
    }

    // Print summary
    console.log('\n\n📊 DISCOVERY SUMMARY');
    console.log('='.repeat(60));

    const workingEndpoints = results.filter(r => r.exists);

    if (workingEndpoints.length === 0) {
      console.log('❌ No working REST endpoints found');
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Check if SOAP API is required (EnhancedHotelBookRQ)');
      console.log('   2. Verify credentials have booking permissions');
      console.log('   3. Contact Sabre support for correct endpoint');
    } else {
      console.log(`✅ Found ${workingEndpoints.length} potential endpoint(s):\n`);

      workingEndpoints.forEach((result, index) => {
        console.log(`${index + 1}. ${result.endpoint}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Payload: ${result.payload}`);
        console.log(`   Response preview: ${result.response.substring(0, 150)}...`);
        console.log('');
      });

      console.log('\n📝 Next Steps:');
      console.log('   1. Update BOOKING_DISCOVERY_RESULTS.md with findings');
      console.log('   2. Update endpoint in src/lib/sabre/booking.ts');
      console.log('   3. Proceed with Phase 1 implementation');
    }

  } catch (error) {
    console.error('\n❌ Discovery test failed:', error);
    console.error('\nEnsure dev server is running: npm run dev');
  }
}

async function testEndpointWithPayload(
  url: string,
  payload: any,
  payloadType: 'minimal' | 'structured',
  token: string,
  results: any[],
  endpoint: string
) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const status = response.status;

    console.log(`   Status: ${status} (${payloadType} payload)`);

    // Determine if endpoint exists
    const exists = status !== 404 && status !== 403;

    if (exists) {
      console.log(`   ✅ Endpoint exists!`);

      // Try to parse response
      try {
        const json = JSON.parse(text);
        console.log(`   Response type: JSON`);

        if (json.Errors || json.errors) {
          console.log(`   ⚠️ Has errors:`, json.Errors || json.errors);
        }

        if (status === 200 || status === 201) {
          console.log(`   🎉 SUCCESS! Booking may have been created`);
        }
      } catch (e) {
        console.log(`   Response type: ${text.substring(0, 50)}...`);
      }

      results.push({
        endpoint,
        status,
        exists: true,
        response: text,
        payload: payloadType,
      });
    } else {
      console.log(`   ❌ Endpoint not found (${status})`);
      results.push({
        endpoint,
        status,
        exists: false,
        response: text.substring(0, 200),
        payload: payloadType,
      });
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Run discovery
discoverBookingEndpoint().catch(console.error);
