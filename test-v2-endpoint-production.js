/**
 * Test /v2/book/hotels in PRODUCTION
 *
 * Test #14 showed this endpoint recognizes our payload structure in CERT.
 * Testing if PRODUCTION has booking access enabled.
 */

const PROD_CONFIG = {
  eprUser: '250463',
  eprPcc: '52JL',
  eprDomain: 'AA',
  password: 'catdog12',
  baseUrl: 'https://api.sabre.com',
};

function buildEPRCredentials() {
  const userString = `V1:${PROD_CONFIG.eprUser}:${PROD_CONFIG.eprPcc}:${PROD_CONFIG.eprDomain}`;
  const encodedUser = Buffer.from(userString).toString('base64');
  const encodedPass = Buffer.from(PROD_CONFIG.password).toString('base64');
  return Buffer.from(`${encodedUser}:${encodedPass}`).toString('base64');
}

async function authenticateProduction() {
  console.log('🔑 Authenticating PRODUCTION...');
  const url = `${PROD_CONFIG.baseUrl}/v2/auth/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${buildEPRCredentials()}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);

  console.log('✅ Authenticated\n');
  return data.access_token;
}

async function testV2BookingEndpoint(token) {
  const url = `${PROD_CONFIG.baseUrl}/v2/book/hotels`;

  // Payload from Test #14 that got a response in CERT
  const payload = {
    CreateBookingRQ: {
      version: '2.0.0',
      HotelBookInfo: {
        HotelCode: '325913',
        CodeContext: 'SABRE',
        StayDateRange: {
          StartDate: '2026-01-25',
          EndDate: '2026-01-27',
        },
        RoomSelection: {
          RoomTypeCode: 'A1K',
          RateCode: 'RAC',
          NumRooms: 1,
        },
      },
      GuestInfo: {
        GivenName: 'John',
        Surname: 'Doe',
        Email: 'test@example.com',
      },
      PaymentInfo: {
        CardType: 'VI',
        CardNumber: '4111111111111111',
        CardholderName: 'JOHN DOE',
        ExpirationDate: '2027-12',
        CVV: '123',
      },
    },
  };

  console.log('Testing: POST /v2/book/hotels (PRODUCTION)');
  console.log('Payload: CreateBookingRQ with HotelBookInfo\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const statusCode = response.status;
  let responseBody;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = await response.text();
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('RESULT:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Status: ${statusCode}`);
  console.log(`Response: ${JSON.stringify(responseBody, null, 2)}\n`);

  console.log('ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (statusCode === 403 && responseBody.errorCode === 'ERR.2SG.SEC.NOT_AUTHORIZED') {
    console.log('❌ SAME AS CERT: No booking access in production either');
    console.log('   Message:', responseBody.message);
    console.log('   Next: Contact Sabre support for booking API access\n');
    return false;
  } else if (statusCode === 400) {
    console.log('✅ BREAKTHROUGH! Validation error - API is accessible!');
    console.log('   Production has booking access!');
    console.log('   Error:', responseBody.message || responseBody);
    console.log('   Next: Fix validation errors and create real bookings\n');
    return true;
  } else if (statusCode === 200) {
    console.log('🎉 SUCCESS! Booking may have been created!');
    console.log('   (Or test card rejected with success response)');
    console.log('   Response:', responseBody);
    console.log('   Next: Implement in production code!\n');
    return true;
  } else {
    console.log(`⚠️  Unexpected ${statusCode} response`);
    console.log('   Response:', responseBody);
    console.log('   Next: Investigate this response type\n');
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing /v2/book/hotels in PRODUCTION                         ║');
  console.log('║   (Test #14 showed this endpoint works in CERT)                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  try {
    const token = await authenticateProduction();
    const hasAccess = await testV2BookingEndpoint(token);

    if (hasAccess) {
      console.log('🎯 PRODUCTION HAS BOOKING ACCESS!');
      console.log('   We can proceed with implementation!');
    } else {
      console.log('❌ Production blocked - need Sabre support intervention');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
