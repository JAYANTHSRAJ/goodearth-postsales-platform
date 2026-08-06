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

function zohoPost(accessToken, path, data) {
  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify({ data: [data] });
    const req = https.request({
      hostname: 'www.zohoapis.com',
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postBody);
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
  console.log('AccessToken obtained.');

  // 1. Create brand new Project Site
  console.log('\n--- 1. CREATING BRAND NEW PROJECT SITE ("Simplified Site V4") ---');
  const projRes = await zohoPost(token, '/crm/v2/Units', { Name: 'Simplified Site V4' });
  const projectSiteId = projRes.body.data[0].details.id;
  console.log(`Created Project Site ID: ${projectSiteId}`);

  // 2. Create brand new Unit
  console.log('\n--- 2. CREATING BRAND NEW UNIT ("Simplified-Unit-V4") ---');
  const unitRes = await zohoPost(token, '/crm/v2/Products', { Product_Name: 'Simplified-Unit-V4', Project_Site: projectSiteId });
  const unitId = unitRes.body.data[0].details.id;
  console.log(`Created Unit ID: ${unitId}`);

  // 3. Create brand new Contact
  console.log('\n--- 3. CREATING BRAND NEW CONTACT ("Simplified Buyer V4") ---');
  const contactRes = await zohoPost(token, '/crm/v2/Contacts', { Last_Name: 'Simplified Buyer V4', First_Name: 'GoodEarth', Email: 'simplified.v4@goodearth.org.in' });
  const contactId = contactRes.body.data[0].details.id;
  console.log(`Created Contact ID: ${contactId}`);

  // 4. Create brand new Deal
  console.log('\n--- 4. CREATING BRAND NEW DEAL ("Simplified-Unit-V4-060826") ---');
  const dealRes = await zohoPost(token, '/crm/v2/Deals', {
    Deal_Name: 'Simplified-Unit-V4-060826',
    Stage: 'Unit Blocked',
    Contact_Name: contactId,
    Project_Site: projectSiteId,
    Unit_Name: unitId,
    Email: 'simplified.v4@goodearth.org.in',
    Closing_Date: '2026-08-31'
  });
  const newDealId = dealRes.body.data[0].details.id;
  console.log(`Created Deal ID: ${newDealId}`);

  // 5. Trigger Webhook on Railway production app
  const webhookUrl = 'https://goodearth-postsales-platform-production.up.railway.app/api/v1/webhooks/zoho/deals';
  console.log(`\n--- 5. TRIGGERING RAILWAY PRODUCTION WEBHOOK ---`);
  console.log(`POST ${webhookUrl} with { id: "${newDealId}" }`);
  const whResponse = await postWebhook(webhookUrl, { id: newDealId });
  console.log(`Webhook Response Status: ${whResponse.status}`);
  console.log(`Webhook Response Body: ${whResponse.body}`);

  console.log('\nWaiting 10 seconds for backend sync processing...');
  await new Promise(r => setTimeout(r, 10000));

  // 6. Fetch Railway Logs
  console.log('\n===============================================================');
  console.log('6. RAILWAY PRODUCTION LOGS FOR SIMPLIFIED PROVISIONING');
  console.log('===============================================================');
  try {
    const railwayLogs = execSync('railway logs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = railwayLogs.split('\n');
    lines.filter(l => l.includes(newDealId) || l.includes('Simplified Site V4') || l.includes('Simplified-Unit-V4') || l.includes('Floor Plans') || l.includes('WORKDRIVE_HIERARCHY')).forEach(l => console.log(l));
  } catch (e) {
    console.error('Logs fetch error:', e.message);
  }

  // 7. Verify WorkDrive Hierarchy via GET /files
  console.log('\n===============================================================');
  console.log('7. LIVE WORKDRIVE API HIERARCHY VERIFICATION');
  console.log('===============================================================');
  const rootRes = await getWorkDriveFiles(token, teamFolderId);

  if (rootRes.body && rootRes.body.data) {
    for (const p of rootRes.body.data) {
      if (p.attributes && p.attributes.name === 'Simplified Site V4') {
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
