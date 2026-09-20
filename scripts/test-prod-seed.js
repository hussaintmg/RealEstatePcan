const https = require('https');

function testProdSeed() {
  return new Promise(async (resolve, reject) => {
    // 1. Get auth cookie first
    const demoReq = https.request('https://real-estate-play-canvas.vercel.app/api/auth/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const rawCookie = res.headers['set-cookie'];
        const authToken = rawCookie ? rawCookie[0].split(';')[0] : '';
        
        console.log('Got cookie from prod auth/demo:', authToken);

        // 2. Call seed-demo
        const seedReq = https.request('https://real-estate-play-canvas.vercel.app/api/properties/seed-demo', {
          method: 'POST',
          headers: {
            'Cookie': authToken,
          },
        }, (sRes) => {
          let sBody = '';
          sRes.on('data', chunk => sBody += chunk);
          sRes.on('end', () => {
            resolve({ status: sRes.statusCode, body: sBody });
          });
        });
        seedReq.on('error', reject);
        seedReq.end();
      });
    });
    demoReq.on('error', reject);
    demoReq.write(JSON.stringify({ role: 'developer' }));
    demoReq.end();
  });
}

async function run() {
  console.log('Testing live Vercel POST /api/properties/seed-demo...');
  const res = await testProdSeed();
  console.log('Vercel Seed Status:', res.status);
  console.log('Vercel Seed Body:', res.body);
}

run().catch(console.error);
