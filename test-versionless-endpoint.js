/**
 * Test Versionless /book/hotels Endpoint
 * Focus test on the one endpoint that didn't return 403
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
  const finalAuth = Buffer.from(`${encodedUser}:${encodedPass}`).toString('base64');
  return finalAuth;
}

async function authenticateProduction() {
  const url = `${PROD_CONFIG.baseUrl}/v2/auth/token`;
  console.log('🔑 Authenticating with PRODUCTION...');

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
  if (!response.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);

  console.log('✅ Authenticated\n');
  return data.access_token;
}

async function testVersionlessEndpoint(token) {
  const url = `${PROD_CONFIG.baseUrl}/book/hotels`;

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
      cardType: 'VI',
      cardNumber: '4111111111111111',
      cardholderName: 'JOHN DOE',
      expirationDate: '2027-12',
      cvv: '123',
    },
  };

  console.log(`Testing: POST ${url}\n`);
  console.log('Request Headers:');
  console.log(`  Content-Type: application/json`);
  console.log(`  Authorization: Bearer ${token.substring(0, 20)}...\n`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(fakePayload),
  });

  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

  const contentType = response.headers.get('content-type');
  let responseBody;

  if (contentType && contentType.includes('application/json')) {
    responseBody = await response.json();
    console.log('\nResponse Body (JSON):');
    console.log(JSON.stringify(responseBody, null, 2));
  } else {
    responseBody = await response.text();
    console.log('\nResponse Body (Text):');
    console.log(responseBody);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('ANALYSIS:');
  console.log('═══════════════════════════════════════\n');

  if (response.status === 403) {
    console.log('❌ 403 Forbidden - No API access (same as versioned endpoints)');
  } else if (response.status === 400) {
    console.log('✅ 400 Bad Request - ENDPOINT IS ACCESSIBLE!');
    console.log('   This means the API is working, just rejecting our payload');
    console.log('   Next: Fix payload structure based on error message');
  } else if (response.status === 200) {
    console.log('✅ 200 OK - ENDPOINT IS ACCESSIBLE!');
    console.log('   Response:', responseBody);
  } else if (!responseBody || responseBody === '') {
    console.log('⚠️  Empty response - Possible OPTIONS preflight or endpoint exists but wrong method');
  } else {
    console.log(`⚠️  ${response.status} - Unexpected response`);
  }

  return { status: response.status, body: responseBody };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Testing Versionless /book/hotels Endpoint');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const token = await authenticateProduction();
    await testVersionlessEndpoint(token);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

main();
