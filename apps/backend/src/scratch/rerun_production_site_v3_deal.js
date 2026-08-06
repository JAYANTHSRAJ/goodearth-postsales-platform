const https = require('https');
const querystring = require('querystring');
const { execSync } = require('child_process');

const clientId = '1000.NGM92PTXHN40XDW0UQ0DPJUMN04OPU';
const clientSecret = '5365fbcc5476c250caffd8d116f26370173efb84eb';
const refreshToken = '1000.cf54c2adc6350c4d629aba7f5545b38a.813898da1585ad8a0f895249053d95f4';
const teamFolderId = '6wbga105d85b36926403d8edcbbaaf29c7583'; // TestSandbox

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    const req = https.request({
      hostname: 'accounts.zoho.com',
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).access_token));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

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

function getWorkDriveFiles(accessToken, folderId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'workdrive.zoho.com',
      path: `/api/v1/files/${folderId}/files`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.api+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = await getAccessToken();
  const dealId = '6638590000147578001'; // Production Site V3 / Production-Unit-V3
  const webhookUrl = 'https://goodearth-postsales-platform-production.up.railway.app/api/v1/webhooks/zoho/deals';

  console.log(`Triggering Railway Production Webhook POST ${webhookUrl} with { id: "${dealId}" }...`);
  const whRes = await postWebhook(webhookUrl, { id: dealId });
  console.log(`Webhook HTTP Status: ${whRes.status}`);
  console.log(`Webhook Response Body: ${whRes.body}`);

  console.log('\nWaiting 10 seconds for backend sync processing...');
  await new Promise(r => setTimeout(r, 10000));

  console.log('\n===============================================================');
  console.log('RAILWAY PRODUCTION LOGS FOR DEAL SYNC');
  console.log('===============================================================');
  try {
    const logs = execSync('railway logs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = logs.split('\n');
    lines.filter(l => l.includes(dealId) || l.includes('Production Site V3') || l.includes('Production-Unit-V3') || l.includes('Zoho API Request') || l.includes('WorkDrive') || l.includes('WORKDRIVE_HIERARCHY')).forEach(l => console.log(l));
  } catch (e) {
    console.error('Logs fetch error:', e.message);
  }

  console.log('\n===============================================================');
  console.log('LIVE WORKDRIVE HIERARCHY VERIFICATION (GET /files)');
  console.log('===============================================================');
  const rootRes = await getWorkDriveFiles(token, teamFolderId);
  if (rootRes.body && rootRes.body.data) {
    for (const p of rootRes.body.data) {
      if (p.attributes && p.attributes.name === 'Production Site V3') {
        console.log(`TestSandbox (${teamFolderId})`);
        console.log(`└── ${p.attributes.name} [Project Folder ID: ${p.id}]`);

        const pTree = await getWorkDriveFiles(token, p.id);
        if (pTree.body && pTree.body.data) {
          for (const u of pTree.body.data) {
            console.log(`    └── ${u.attributes.name} [Unit Folder ID: ${u.id}]`);

            const uTree = await getWorkDriveFiles(token, u.id);
            if (uTree.body && uTree.body.data) {
              uTree.body.data.forEach((sub, idx) => {
                const isLast = idx === uTree.body.data.length - 1;
                console.log(`        ${isLast ? '└──' : '├──'} ${sub.attributes.name} [ID: ${sub.id}]`);
              });
            }
          }
        }
      }
    }
  }
}

main().catch(console.error);
