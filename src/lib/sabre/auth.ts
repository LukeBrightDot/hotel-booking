// import { prisma } from '@/lib/db/prisma';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenCache {
  token: string;
  expiresAt: number;
  version: string;
}

let tokenCache: TokenCache | null = null;

const SABRE_CONFIG = {
  clientId: process.env.SABRE_CLIENT_ID!,
  clientSecret: process.env.SABRE_CLIENT_SECRET!,
  username: process.env.SABRE_USERNAME!,
  password: process.env.SABRE_PASSWORD!,
  eprUser: process.env.SABRE_EPR_USER || '250463',
  eprPcc: process.env.SABRE_EPR_PCC || '52JL',
  eprDomain: process.env.SABRE_EPR_DOMAIN || 'AA',
  prodSecret: process.env.SABRE_PROD_SECRET!,
  certSecret: process.env.SABRE_CERT_SECRET!,
  environment: process.env.SABRE_ENVIRONMENT || 'cert',
  certUrl: process.env.SABRE_CERT_URL!,
  prodUrl: process.env.SABRE_PROD_URL!,
  // Working base URL from bellhopping-sabre-test
  sabreBaseUrl: process.env.SABRE_BASE_URL || 'https://api.sabre.com',
};

function getBaseUrl(): string {
  // Use the working base URL from bellhopping-sabre-test
  return SABRE_CONFIG.sabreBaseUrl;
}

function getSecret(): string {
  return SABRE_CONFIG.environment === 'cert'
    ? SABRE_CONFIG.certSecret
    : SABRE_CONFIG.prodSecret;
}

// WORKING FORMAT from bellhopping-sabre-test
// Format: base64(base64("V1:250463:52JL:AA"):base64("catdog12"))
function buildEPRCredentials(): string {
  const userString = `V1:${SABRE_CONFIG.eprUser}:${SABRE_CONFIG.eprPcc}:${SABRE_CONFIG.eprDomain}`;
  const encodedUser = Buffer.from(userString).toString('base64');
  const encodedPass = Buffer.from(SABRE_CONFIG.password).toString('base64');
  const finalAuth = Buffer.from(`${encodedUser}:${encodedPass}`).toString('base64');
  return finalAuth;
}

// V3 Password Grant format (from CORRECTED_SABRE_SETUP.md)
function buildClientSecretAuth(): string {
  const creds = `${SABRE_CONFIG.clientId}:${SABRE_CONFIG.clientSecret}`;
  return Buffer.from(creds).toString('base64');
}

// Old format (less likely to work)
function buildClientCredentials(): string {
  // Format: base64(clientId:base64(base64(username):base64(password)))
  const userEncoded = Buffer.from(SABRE_CONFIG.username).toString('base64');
  const passEncoded = Buffer.from(SABRE_CONFIG.password).toString('base64');
  const innerCreds = `${userEncoded}:${passEncoded}`;
  const innerEncoded = Buffer.from(innerCreds).toString('base64');
  const fullCreds = `${SABRE_CONFIG.clientId}:${innerEncoded}`;
  return Buffer.from(fullCreds).toString('base64');
}

// Alternative credential format (simpler)
function buildSimpleCredentials(): string {
  const creds = `${SABRE_CONFIG.clientId}:${getSecret()}`;
  return Buffer.from(creds).toString('base64');
}

async function logApiCall(
  endpoint: string,
  method: string,
  request: any,
  response: any,
  statusCode: number,
  responseTime: number,
  error?: string
) {
  // Logging disabled for now - Prisma setup in progress
  console.log(`API Call: ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`);
  // try {
  //   await prisma.apiLog.create({
  //     data: {
  //       endpoint,
  //       method,
  //       requestBody: request,
  //       responseBody: response,
  //       statusCode,
  //       responseTime,
  //       error,
  //     },
  //   });
  // } catch (e) {
  //   console.error('Failed to log API call:', e);
  // }
}

// V3 Password Grant Authentication
// ⚠️ IMPORTANT: This requires special provisioning from Sabre
//
// STATUS: Currently returns "invalid_client" error because Client ID is NOT provisioned
// for V3 password grant authentication.
//
// ROOT CAUSE: V3 OAuth password grant requires the Client ID to be specifically enabled
// by Sabre account manager. Our Client ID (VD35-Coastline52JL) works for V2 but is not
// provisioned for V3.
//
// From official V3 YAML spec: "To provision a new clientId contact your account manager"
//
// TO FIX: Contact Sabre account manager and request:
//   - Enable V3 OAuth password grant for Client ID: VD35-Coastline52JL
//   - OR provision new Client ID specifically for V3
//
// DIFFERENCES FROM V2:
//   - V2: Uses client_credentials grant (application-level, no provisioning needed)
//   - V3: Uses password grant (user-level, requires provisioning)
//
// For more details, see: SABRE_AUTH_V3_TEST_RESULTS.md
export async function authenticateV3(): Promise<TokenCache> {
  const url = `${getBaseUrl()}/v3/auth/token`;
  const startTime = Date.now();

  console.log('Attempting V3 authentication (password grant)...');

  try {
    // V3 Password Grant: Client ID/Secret in header, Username/Password in body
    const clientAuth = buildClientSecretAuth();
    const eprUsername = `V1:${SABRE_CONFIG.eprUser}:${SABRE_CONFIG.eprPcc}:${SABRE_CONFIG.eprDomain}`;

    const body = new URLSearchParams({
      grant_type: 'password',
      username: eprUsername,
      password: SABRE_CONFIG.password,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${clientAuth}`,
      },
      body: body.toString(),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    await logApiCall(url, 'POST', { grant_type: 'password' }, data, response.status, responseTime);

    if (!response.ok) {
      throw new Error(`V3 password grant failed: ${JSON.stringify(data)}`);
    }

    console.log('✅ V3 password grant authentication successful!');
    const tokenData = data as TokenResponse;
    return {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      version: 'v3-password',
    };
  } catch (error) {
    console.error('V3 authentication failed:', error);
    throw error;
  }
}

export async function authenticateV2(): Promise<TokenCache> {
  const url = `${getBaseUrl()}/v2/auth/token`;
  const startTime = Date.now();

  console.log('Attempting V2 authentication (EPR format)...');

  // WORKING FORMAT from bellhopping-sabre-test
  try {
    const eprCreds = buildEPRCredentials();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${eprCreds}`,
      },
      body: 'grant_type=client_credentials',
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    await logApiCall(url, 'POST', { grant_type: 'client_credentials', format: 'EPR' }, data, response.status, responseTime);

    if (response.ok) {
      console.log('✅ V2 EPR authentication successful!');
      const tokenData = data as TokenResponse;
      return {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        version: 'v2-epr',
      };
    }

    throw new Error(`V2 EPR auth failed: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error('V2 EPR authentication failed:', error);
    throw error;
  }
}

// Session-based auth (legacy fallback)
async function authenticateV1(): Promise<TokenCache> {
  const url = `${getBaseUrl()}/v1/auth/token`;
  const startTime = Date.now();

  console.log('Attempting V1 session authentication...');

  try {
    const body = new URLSearchParams({
      client_id: SABRE_CONFIG.clientId,
      client_secret: getSecret(),
      grant_type: 'password',
      username: SABRE_CONFIG.username,
      password: SABRE_CONFIG.password,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    await logApiCall(url, 'POST', { grant_type: 'password' }, data, response.status, responseTime);

    if (!response.ok) {
      throw new Error(`V1 auth failed: ${JSON.stringify(data)}`);
    }

    const tokenData = data as TokenResponse;
    return {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      version: 'v1',
    };
  } catch (error) {
    console.error('V1 authentication failed:', error);
    throw error;
  }
}

export async function getAuthToken(): Promise<string> {
  // Check cache with 5-minute buffer
  if (tokenCache && Date.now() < tokenCache.expiresAt - 300000) {
    console.log(`Using cached token (${tokenCache.version})`);
    return tokenCache.token;
  }

  // Try authentication methods in order - V2 EPR first (proven working)
  //
  // PRIORITY ORDER EXPLAINED:
  // 1. V2 EPR: ✅ WORKING (~70ms) - Uses client_credentials grant, no special provisioning
  // 2. V3 Password Grant: ❌ NOT PROVISIONED - Requires Sabre account manager to enable
  // 3. V1 Legacy: ⚠️ UNTESTED - Fallback for compatibility
  //
  // See SABRE_AUTH_V3_TEST_RESULTS.md for full analysis
  const authMethods = [
    { name: 'V2 EPR (Working)', fn: authenticateV2 },
    { name: 'V3 Password Grant', fn: authenticateV3 },
    { name: 'V1 Legacy', fn: authenticateV1 },
  ];

  for (const method of authMethods) {
    try {
      console.log(`\n🔑 Trying ${method.name}...`);
      tokenCache = await method.fn();
      console.log(`✅ Authentication successful: ${tokenCache.version}`);
      return tokenCache.token;
    } catch (error) {
      console.warn(`❌ ${method.name} failed, trying next...`);
      continue;
    }
  }

  throw new Error('All authentication methods failed');
}

export async function testAuthentication(): Promise<{
  success: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    return {
      success: true,
      version: tokenCache?.version,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}
