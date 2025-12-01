/**
 * Test auto-generate budget endpoint to verify it uses the new crew templates
 */

const https = require('https');

const PRODUCTION_ID = 'ce8f64eb-fdbc-4018-a3cf-7f66920daf8a'; // "Chipd The Movie" theatrical production

async function testAutoGenerate() {
  console.log('🧪 Testing auto-generate budget feature...\n');
  console.log(`Production ID: ${PRODUCTION_ID}`);
  console.log(`Endpoint: POST /api/productions/${PRODUCTION_ID}/auto-generate-budget\n`);

  const options = {
    hostname: 'backend-production-8e04.up.railway.app',
    port: 443,
    path: `/api/productions/${PRODUCTION_ID}/auto-generate-budget`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          console.log(`✅ Status: ${res.statusCode}\n`);

          if (result.success) {
            console.log(`📊 Budget generated successfully!`);
            console.log(`   Line items created: ${result.itemsCreated}`);
            console.log(`   Expected: 88+ crew positions (not 26 summary items)\n`);

            if (result.itemsCreated >= 88) {
              console.log('🎉 SUCCESS! Auto-generate is now creating detailed budgets');
            } else if (result.itemsCreated === 26) {
              console.log('❌ FAILURE! Still creating summary budget (old behavior)');
              console.log('   The production_type_crews table may not be queried correctly');
            } else {
              console.log(`⚠️  Created ${result.itemsCreated} items - investigating...`);
            }
          } else {
            console.log('❌ Error:', result.message || result.error);
          }

          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

testAutoGenerate().catch(console.error);
