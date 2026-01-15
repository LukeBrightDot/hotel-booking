/**
 * Test Production Booking Endpoint
 *
 * Tests Sabre booking API in PRODUCTION environment with FAKE data
 * No real booking will be created - test card will be rejected
 *
 * Purpose: Determine if production has booking API access or same 403 error
 */

const PROD_CONFIG = {
  clientId: 'VD35-Coastline52JL',
  prodSecret: '6U48x9u2',
  eprUser: '250463',
  eprPcc: '52JL',
  eprDomain: 'AA',
  password: 'catdog12',
  baseUrl: 'https://api.sabre.com',
};

// V2 EPR Authentication (same as CERT)
function buildEPRCredentials() {
  const userString = `V1:${PROD_CONFIG.eprUser}:${PROD_CONFIG.eprPcc}:${PROD_CONFIG.eprDomain}`;
  const encodedUser = Buffer.from(userString).toString('base64');
  const encodedPass = Buffer.from(PROD_CONFIG.password).toString('base64');
  const finalAuth = Buffer.from(`${encodedUser}:${encodedPass}`).toString('base64');
  return finalAuth;
}

async function authenticateProduction() {
  const url = `${PROD_CONFIG.baseUrl}/v2/auth/token`;

  console.log('🔑 Authenticating with PRODUCTION credentials...');
  console.log(`   URL: ${url}`);

  const eprCreds = buildEPRCredentials();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${eprCreds}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Production auth failed: ${JSON.stringify(data, null, 2)}`);
  }

  console.log('✅ Production authentication successful!');
  console.log(`   Token expires in: ${data.expires_in}s`);

  return data.access_token;
}

async function testBookingEndpoint(token) {
  // Test all known booking endpoint variations
  const endpoints = [
    '/v1/book/hotels',
    '/v2/book/hotels',
    '/v2.0.0/book/hotels',
    '/v3/book/hotels',
    '/book/hotels',
  ];

  // Fake booking payload (from SABRE_BOOKING_API_MAPPING.md)
  const fakePayload = {
    hotel: {
      hotelId: '325913',
      chainCode: 'LX',
      checkInDate: '2026-01-20',
      checkOutDate: '2026-01-22',
      roomTypeCode: 'SLHWITHIN',
      rateCode: 'SLHWITHIN',
      numberOfRooms: 1,
      numberOfGuests: 2,
    },
    guest: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Miami',
        stateProvince: 'FL',
        postalCode: '33101',
        country: 'US',
      },
    },
    payment: {
      cardType: 'VI', // Visa
      cardNumber: '4111111111111111', // Test card - will be rejected
      cardholderName: 'JOHN DOE',
      expirationDate: '2027-12',
      cvv: '123',
    },
  };

  console.log('\n📡 Testing booking endpoints in PRODUCTION...\n');

  const results = [];

  for (const endpoint of endpoints) {
    const url = `${PROD_CONFIG.baseUrl}${endpoint}`;
    console.log(`Testing: ${endpoint}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fakePayload),
      });

      const statusCode = response.status;
      let data;

      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      const result = {
        endpoint,
        statusCode,
        success: response.ok,
        data,
      };

      results.push(result);

      // Log result
      if (statusCode === 403) {
        console.log(`   ❌ 403 Forbidden - Same as CERT (no access)`);
      } else if (statusCode === 400) {
        console.log(`   ✅ 400 Bad Request - ENDPOINT WORKS! (validation error)`);
        console.log(`   Error: ${JSON.stringify(data).substring(0, 100)}...`);
      } else if (statusCode === 200) {
        console.log(`   ✅ 200 OK - ENDPOINT WORKS!`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`   ⚠️  ${statusCode} - ${JSON.stringify(data).substring(0, 100)}...`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        endpoint,
        error: error.message,
      });
    }

    console.log('');
  }

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SABRE PRODUCTION BOOKING ENDPOINT TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  Using FAKE data - no real booking will be created');
  console.log('⚠️  Test card 4111111111111111 will be rejected by Sabre\n');

  try {
    // Step 1: Authenticate
    const token = await authenticateProduction();

    // Step 2: Test booking endpoints
    const results = await testBookingEndpoint(token);

    // Step 3: Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const accessibleEndpoints = results.filter(r => r.statusCode !== 403);
    const forbiddenEndpoints = results.filter(r => r.statusCode === 403);

    console.log(`✅ Accessible endpoints: ${accessibleEndpoints.length}/${results.length}`);
    console.log(`❌ Forbidden endpoints: ${forbiddenEndpoints.length}/${results.length}\n`);

    if (accessibleEndpoints.length > 0) {
      console.log('🎉 SUCCESS! Production has booking API access!');
      console.log('   Working endpoints:');
      accessibleEndpoints.forEach(r => {
        console.log(`   - ${r.endpoint} (${r.statusCode})`);
      });
      console.log('\n   Next: Fix validation errors and create real bookings');
    } else {
      console.log('❌ BLOCKED! Production has same 403 error as CERT');
      console.log('   Next: Contact Sabre account manager for booking API access');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
