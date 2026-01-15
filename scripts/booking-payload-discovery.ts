#!/usr/bin/env npx ts-node
/**
 * Sabre Booking API Payload Discovery Script
 *
 * Purpose: Systematically test payload variations to discover the correct
 * structure for the /book/hotels endpoint.
 *
 * Key Insight: The search API uses wrapper pattern (GetHotelAvailRQ/RS).
 * Booking API likely follows similar pattern.
 *
 * Target: Any non-empty response (validation error = success!)
 *
 * Run: npx ts-node scripts/booking-payload-discovery.ts
 */

import * as https from 'https';
import * as http from 'http';

// Configuration
const CONFIG = {
  // EPR Authentication (proven working)
  eprUser: process.env.SABRE_EPR_USER || '250463',
  eprPcc: process.env.SABRE_EPR_PCC || '52JL',
  eprDomain: process.env.SABRE_EPR_DOMAIN || 'AA',
  password: process.env.SABRE_PASSWORD || 'catdog12',
  baseUrl: 'https://api.sabre.com',

  // Test data from successful search
  testHotel: {
    hotelCode: '325913',
    chainCode: 'LX',
    checkIn: '2026-01-25',
    checkOut: '2026-01-27',
    roomTypeCode: 'A1K',
    rateCode: 'RAC',
  },

  // Minimal guest data
  testGuest: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
  },
};

// ============================================================================
// AUTHENTICATION (Proven Working - V2 EPR)
// ============================================================================

async function getAuthToken(): Promise<string> {
  const userString = `V1:${CONFIG.eprUser}:${CONFIG.eprPcc}:${CONFIG.eprDomain}`;
  const encodedUser = Buffer.from(userString).toString('base64');
  const encodedPass = Buffer.from(CONFIG.password).toString('base64');
  const finalAuth = Buffer.from(`${encodedUser}:${encodedPass}`).toString('base64');

  const response = await fetch(`${CONFIG.baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${finalAuth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// ============================================================================
// TEST PAYLOAD DEFINITIONS
// ============================================================================

interface TestCase {
  id: number;
  name: string;
  description: string;
  hypothesis: string;
  endpoint: string;
  contentType: string;
  payload: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

function generateTestCases(): TestCase[] {
  const { testHotel, testGuest } = CONFIG;

  return [
    // =========================================================================
    // TIER 1: HIGH PRIORITY - Most likely to work based on Sabre patterns
    // =========================================================================

    {
      id: 1,
      name: 'CreateBookingRQ Wrapper (Minimal)',
      description: 'Matches search API pattern: GetHotelAvailRQ → CreateBookingRQ',
      hypothesis: 'Sabre REST APIs use RQ suffix for request wrappers',
      priority: 'HIGH',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        CreateBookingRQ: {
          version: '2.0.0',
        }
      }
    },

    {
      id: 2,
      name: 'HotelBookRQ Wrapper (Minimal)',
      description: 'Alternative wrapper name matching hotel context',
      hypothesis: 'Hotel-specific endpoints may use HotelBookRQ',
      priority: 'HIGH',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        HotelBookRQ: {
          version: '2.0.0',
        }
      }
    },

    {
      id: 3,
      name: 'OTA_HotelResRQ Wrapper (OTA Standard)',
      description: 'Open Travel Alliance naming convention',
      hypothesis: 'Sabre uses OTA standards internally (SOAP heritage)',
      priority: 'HIGH',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        OTA_HotelResRQ: {
          Version: '2.0',
        }
      }
    },

    {
      id: 4,
      name: 'EnhancedHotelBookRQ (Enhanced Pattern)',
      description: 'Some Sabre APIs use "Enhanced" prefix',
      hypothesis: 'Booking may use enhanced API variant',
      priority: 'HIGH',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        EnhancedHotelBookRQ: {
          version: '2.0.0',
        }
      }
    },

    {
      id: 5,
      name: 'CreateBookingRQ with HotelBookInfo',
      description: 'Full structure matching SABRE_BOOKING_API_MAPPING.md',
      hypothesis: 'Our mapping doc defines correct nested structure',
      priority: 'HIGH',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        CreateBookingRQ: {
          HotelBookInfo: {
            HotelCode: testHotel.hotelCode,
            CodeContext: 'SABRE',
            StayDateRange: {
              StartDate: testHotel.checkIn,
              EndDate: testHotel.checkOut,
            },
            RoomSelection: {
              RoomTypeCode: testHotel.roomTypeCode,
              RateCode: testHotel.rateCode,
              NumRooms: 1,
            },
          }
        }
      }
    },

    // =========================================================================
    // TIER 2: MEDIUM PRIORITY - Alternative patterns
    // =========================================================================

    {
      id: 6,
      name: 'Flat Structure (No Wrapper)',
      description: 'Direct fields without wrapper object',
      hypothesis: 'Modern REST APIs may skip wrapper',
      priority: 'MEDIUM',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        hotelCode: testHotel.hotelCode,
        checkIn: testHotel.checkIn,
        checkOut: testHotel.checkOut,
      }
    },

    {
      id: 7,
      name: 'HotelReservation Root Element',
      description: 'Common reservation system naming',
      hypothesis: 'Sabre may use industry-standard naming',
      priority: 'MEDIUM',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        HotelReservation: {
          HotelCode: testHotel.hotelCode,
          StartDate: testHotel.checkIn,
          EndDate: testHotel.checkOut,
        }
      }
    },

    {
      id: 8,
      name: 'PassengerNameRecord Pattern',
      description: 'PNR-style booking (Sabre GDS heritage)',
      hypothesis: 'Hotel booking may require PNR structure',
      priority: 'MEDIUM',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        CreatePNR_RQ: {
          HotelSegment: {
            HotelCode: testHotel.hotelCode,
          }
        }
      }
    },

    {
      id: 9,
      name: 'Version at Root Level',
      description: 'Test if version must be at root, not nested',
      hypothesis: 'Version handling may differ from search API',
      priority: 'MEDIUM',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        version: '2.0.0',
        request: {
          hotelCode: testHotel.hotelCode,
        }
      }
    },

    {
      id: 10,
      name: 'Form-Encoded (Like Auth)',
      description: 'Form-encoded like authentication endpoint',
      hypothesis: 'Some Sabre endpoints prefer form encoding',
      priority: 'MEDIUM',
      endpoint: '/book/hotels',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        HotelCode: testHotel.hotelCode,
        CheckIn: testHotel.checkIn,
        CheckOut: testHotel.checkOut,
      }
    },

    // =========================================================================
    // TIER 3: LOW PRIORITY - Edge cases and exploration
    // =========================================================================

    {
      id: 11,
      name: 'Empty Object (Echo Test)',
      description: 'Send empty object to see if endpoint responds differently',
      hypothesis: 'May reveal expected structure in error',
      priority: 'LOW',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {}
    },

    {
      id: 12,
      name: 'BookingRequest Generic',
      description: 'Generic REST-style naming',
      hypothesis: 'May use standard REST naming',
      priority: 'LOW',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        BookingRequest: {
          hotelId: testHotel.hotelCode,
          dates: {
            start: testHotel.checkIn,
            end: testHotel.checkOut,
          }
        }
      }
    },

    {
      id: 13,
      name: 'SABRE_HotelBookRQ (Prefixed)',
      description: 'Some APIs use SABRE_ prefix',
      hypothesis: 'Internal Sabre naming convention',
      priority: 'LOW',
      endpoint: '/book/hotels',
      contentType: 'application/json',
      payload: {
        SABRE_HotelBookRQ: {
          HotelCode: testHotel.hotelCode,
        }
      }
    },

    {
      id: 14,
      name: 'V2 Versioned Endpoint',
      description: 'Try versioned endpoint despite 403s',
      hypothesis: '403 may be payload-dependent',
      priority: 'LOW',
      endpoint: '/v2/book/hotels',
      contentType: 'application/json',
      payload: {
        CreateBookingRQ: {
          version: '2.0.0',
          HotelBookInfo: {
            HotelCode: testHotel.hotelCode,
          }
        }
      }
    },

    {
      id: 15,
      name: 'XML Content-Type with JSON',
      description: 'Some SOAP-to-REST endpoints expect XML header',
      hypothesis: 'Content negotiation may affect response',
      priority: 'LOW',
      endpoint: '/book/hotels',
      contentType: 'application/xml',
      payload: {
        CreateBookingRQ: {
          HotelCode: testHotel.hotelCode,
        }
      }
    },
  ];
}

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  testCase: TestCase;
  status: number;
  responseBody: string;
  responseTime: number;
  hasContent: boolean;
  isSuccess: boolean;
  analysis: string;
}

async function runTest(token: string, testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${CONFIG.baseUrl}${testCase.endpoint}`;

  let body: string;
  if (testCase.contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(testCase.payload)) {
      params.append(key, String(value));
    }
    body = params.toString();
  } else {
    body = JSON.stringify(testCase.payload);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': testCase.contentType,
        'Accept': 'application/json, application/xml, text/plain, */*',
      },
      body,
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    const hasContent = responseBody.trim().length > 0;

    // Success criteria: non-empty response OR error message
    const isSuccess = hasContent || response.status >= 400;

    let analysis = '';
    if (hasContent) {
      try {
        const json = JSON.parse(responseBody);
        if (json.error || json.errors || json.message) {
          analysis = 'VALIDATION ERROR - Payload recognized but invalid!';
        } else if (json.Errors || json.ApplicationResults?.Error) {
          analysis = 'SABRE ERROR - Request processed but failed validation!';
        } else {
          analysis = 'JSON RESPONSE - May indicate valid structure!';
        }
      } catch {
        if (responseBody.includes('<') && responseBody.includes('>')) {
          analysis = 'XML RESPONSE - May need different content-type';
        } else {
          analysis = 'NON-JSON RESPONSE';
        }
      }
    } else {
      analysis = response.status === 200
        ? 'EMPTY 200 - Payload not recognized (wrong structure)'
        : `HTTP ${response.status} - Access/permission issue`;
    }

    return {
      testCase,
      status: response.status,
      responseBody,
      responseTime,
      hasContent,
      isSuccess,
      analysis,
    };
  } catch (error) {
    return {
      testCase,
      status: 0,
      responseBody: String(error),
      responseTime: Date.now() - startTime,
      hasContent: true,
      isSuccess: false,
      analysis: 'NETWORK ERROR',
    };
  }
}

async function runAllTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       SABRE BOOKING API PAYLOAD DISCOVERY                        ║');
  console.log('║       Target: Find payload structure that gets a response        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Get auth token
  console.log('🔐 Authenticating with V2 EPR...');
  const token = await getAuthToken();
  console.log('✅ Authentication successful!\n');

  // Generate test cases
  const testCases = generateTestCases();
  const results: TestResult[] = [];

  // Group by priority
  const highPriority = testCases.filter(t => t.priority === 'HIGH');
  const mediumPriority = testCases.filter(t => t.priority === 'MEDIUM');
  const lowPriority = testCases.filter(t => t.priority === 'LOW');

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' TIER 1: HIGH PRIORITY TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const testCase of highPriority) {
    console.log(`\n📝 Test #${testCase.id}: ${testCase.name}`);
    console.log(`   Hypothesis: ${testCase.hypothesis}`);
    console.log(`   Endpoint: ${testCase.endpoint}`);
    console.log(`   Payload: ${JSON.stringify(testCase.payload).substring(0, 100)}...`);

    const result = await runTest(token, testCase);
    results.push(result);

    const statusIcon = result.hasContent ? '🎯' : (result.status === 200 ? '⚪' : '❌');
    console.log(`   ${statusIcon} Status: ${result.status} | Time: ${result.responseTime}ms | Content: ${result.hasContent}`);
    console.log(`   Analysis: ${result.analysis}`);

    if (result.hasContent && result.responseBody.length < 500) {
      console.log(`   Response: ${result.responseBody}`);
    }

    // If we got content, this is a breakthrough!
    if (result.hasContent) {
      console.log('\n🎉 BREAKTHROUGH! Got a response with content!');
      console.log('   Full response saved to results below.');
    }

    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' TIER 2: MEDIUM PRIORITY TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const testCase of mediumPriority) {
    console.log(`\n📝 Test #${testCase.id}: ${testCase.name}`);
    const result = await runTest(token, testCase);
    results.push(result);

    const statusIcon = result.hasContent ? '🎯' : (result.status === 200 ? '⚪' : '❌');
    console.log(`   ${statusIcon} Status: ${result.status} | Analysis: ${result.analysis}`);

    if (result.hasContent && result.responseBody.length < 500) {
      console.log(`   Response: ${result.responseBody}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' TIER 3: LOW PRIORITY TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const testCase of lowPriority) {
    console.log(`\n📝 Test #${testCase.id}: ${testCase.name}`);
    const result = await runTest(token, testCase);
    results.push(result);

    const statusIcon = result.hasContent ? '🎯' : (result.status === 200 ? '⚪' : '❌');
    console.log(`   ${statusIcon} Status: ${result.status} | Analysis: ${result.analysis}`);

    await new Promise(r => setTimeout(r, 500));
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY REPORT                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const breakthroughs = results.filter(r => r.hasContent);
  const empty200s = results.filter(r => r.status === 200 && !r.hasContent);
  const errors = results.filter(r => r.status >= 400);

  console.log(`Total Tests: ${results.length}`);
  console.log(`🎯 Breakthroughs (got content): ${breakthroughs.length}`);
  console.log(`⚪ Empty 200s (wrong structure): ${empty200s.length}`);
  console.log(`❌ HTTP Errors (4xx/5xx): ${errors.length}`);

  if (breakthroughs.length > 0) {
    console.log('\n📊 BREAKTHROUGH DETAILS:\n');
    for (const result of breakthroughs) {
      console.log(`Test #${result.testCase.id}: ${result.testCase.name}`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Analysis: ${result.analysis}`);
      console.log(`  Payload sent: ${JSON.stringify(result.testCase.payload, null, 2)}`);
      console.log(`  Response: ${result.responseBody.substring(0, 1000)}`);
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' NEXT STEPS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (breakthroughs.length > 0) {
    console.log('✅ Found payload structure(s) that Sabre recognizes!');
    console.log('   1. Analyze the error messages to understand required fields');
    console.log('   2. Build on the working structure, adding fields one by one');
    console.log('   3. Test with real hotel/rate codes from search results');
  } else {
    console.log('❌ No breakthroughs yet. Additional tests to try:');
    console.log('   1. Try different API versions: /v1.0.0/, /v2.1.0/, etc.');
    console.log('   2. Test SOAP-style XML payloads');
    console.log('   3. Check if there\'s a separate rate quote/hold step required');
    console.log('   4. Verify hotel/rate codes are from a recent search');
    console.log('   5. Consider that booking may require different auth scope');
  }

  // Save detailed results
  const reportPath = './booking-discovery-results.json';
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    breakthroughs: breakthroughs.length,
    empty200s: empty200s.length,
    errors: errors.length,
    results: results.map(r => ({
      id: r.testCase.id,
      name: r.testCase.name,
      priority: r.testCase.priority,
      status: r.status,
      hasContent: r.hasContent,
      analysis: r.analysis,
      responseTime: r.responseTime,
      responseBody: r.responseBody,
      payloadSent: r.testCase.payload,
    })),
  };

  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Detailed results saved to: ${reportPath}`);
}

// Run the discovery
runAllTests().catch(console.error);
