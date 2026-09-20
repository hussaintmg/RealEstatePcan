const https = require('https');

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = https.request('https://real-estate-play-canvas.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const emails = [
    'developer@auraheights.com',
    'dev@platform.local',
    'admin@auraheights.com',
    'admin@example.com',
    'developer@example.com',
    'dev@auraheights.com',
    'hussain@auraheights.com',
    'hussaintmg@gmail.com',
    'owner@auraheights.com',
  ];
  const passwords = [
    'DeveloperPassword123!',
    'DevPassword2026!',
    'OwnerPassword2026!',
    'admin123',
    'password123',
  ];

  for (const email of emails) {
    for (const pass of passwords) {
      const res = await testLogin(email, pass);
      if (res.status === 200) {
        console.log('SUCCESS! Found working login:', email, pass, res.body);
        return;
      }
    }
    console.log(`Checked ${email} - all failed.`);
  }
}

run().catch(console.error);
