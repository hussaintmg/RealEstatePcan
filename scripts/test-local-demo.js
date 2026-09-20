const http = require('http');

function makeReq(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('--- TEST 1: POST /api/auth/demo ---');
  const demoRes = await makeReq({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/demo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ role: 'developer' }));

  console.log('Demo Auth Status:', demoRes.status);
  console.log('Demo Auth Body:', demoRes.body);
  console.log('Demo Auth Cookie:', demoRes.headers['set-cookie']);

  const cookie = demoRes.headers['set-cookie']?.[0]?.split(';')?.[0] || '';

  console.log('\n--- TEST 2: POST /api/properties/seed-demo ---');
  const seedRes = await makeReq({
    hostname: 'localhost',
    port: 3000,
    path: '/api/properties/seed-demo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
  });

  console.log('Seed Demo Status:', seedRes.status);
  console.log('Seed Demo Body:', seedRes.body);
}

test().catch(console.error);
