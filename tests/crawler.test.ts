const nodeFetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from both .env and .env.local
dotenv.config(); // Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') }); // Load .env.local

// Debug environment variables (without exposing sensitive values)
console.log('Environment variables loaded:', {
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '✓ Present' : '✗ Missing',
  TEST_USER_ID: process.env.TEST_USER_ID ? '✓ Present' : '✗ Missing',
  GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_API_KEY ? '✓ Present' : '✗ Missing',
  GOOGLE_CX: process.env.GOOGLE_CUSTOM_SEARCH_CX ? '✓ Present' : '✗ Missing',
});

async function getClerkSessionToken() {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY environment variable is required');
  }

  try {
    // 1. Create a new session
    const sessionResponse = await nodeFetch(
      'https://api.clerk.dev/v1/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: process.env.TEST_USER_ID, // The ID of your test user
        }),
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      throw new Error(`Failed to create session: ${error}`);
    }

    const session = await sessionResponse.json();

    // 2. Create a session token
    const tokenResponse = await nodeFetch(
      `https://api.clerk.dev/v1/sessions/${session.id}/tokens`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to create token: ${error}`);
    }

    const { jwt } = await tokenResponse.json();
    return jwt;
  } catch (error) {
    console.error('Failed to get Clerk session token:', error);
    throw error;
  }
}

async function testImageSearch() {
  try {
    // Get a fresh session token
    const sessionToken = await getClerkSessionToken();
    console.log('Got session token');

    const testProducts = [
      {
        brand: "Shiseido",
        name: "Synchro Skin Radiant Lifting Foundation"
      },
      {
        brand: "La Mer",
        name: "Crème de la Mer"
      },
      {
        brand: "SK-II",
        name: "Facial Treatment Essence"
      }
    ];

    console.log('Starting image search tests...\n');

    for (const product of testProducts) {
      console.log(`Testing: ${product.brand} ${product.name}`);
      
      try {
        const params = new URLSearchParams({
          brand: product.brand,
          name: product.name
        });

        const response = await nodeFetch(
          `http://localhost:3000/api/get-product-image?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          }
        );

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Success!');
          console.log('Source:', result.data.source);
          console.log('Image URL:', result.data.imageUrl);
          console.log('Source URL:', result.data.sourceUrl);
        } else {
          console.log('❌ Failed:', result.message);
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
      
      console.log('\n---\n');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageSearch().catch(console.error); 