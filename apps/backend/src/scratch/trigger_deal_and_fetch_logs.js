const https = require('https');
const { execSync } = require('child_process');

function postWebhook(url, payload) {
  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify(payload);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: body }));
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

async function main() {
  const dealId = '6638590000147578001';
  const webhookUrl = 'https://goodearth-postsales-platform-production.up.railway.app/api/v1/webhooks/zoho/deals';

  console.log(`Triggering Railway Production Webhook POST ${webhookUrl} with { id: "${dealId}" }...`);
  const whRes = await postWebhook(webhookUrl, { id: dealId });
  console.log(`Webhook HTTP Status: ${whRes.status}`);
  console.log(`Webhook Response Body: ${whRes.body}`);

  console.log('\nWaiting 5 seconds for backend processing...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n===============================================================');
  console.log('COMPLETE RAILWAY LOGS AFTER WEBHOOK');
  console.log('===============================================================');
  try {
    const logs = execSync('railway logs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    console.log(logs);
  } catch (e) {
    console.error('Logs fetch error:', e.message);
  }
}

main().catch(console.error);
