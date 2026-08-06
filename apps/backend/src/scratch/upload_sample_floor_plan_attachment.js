const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const clientId = '1000.NGM92PTXHN40XDW0UQ0DPJUMN04OPU';
const clientSecret = '5365fbcc5476c250caffd8d116f26370173efb84eb';
const refreshToken = '1000.cf54c2adc6350c4d629aba7f5545b38a.813898da1585ad8a0f895249053d95f4';

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

function uploadAttachment(token, dealId, fileName, fileBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = '--------------------------' + Date.now().toString(16);
    const crlf = '\r\n';

    let header = `--${boundary}${crlf}`;
    header += `Content-Disposition: form-data; name="file"; filename="${fileName}"${crlf}`;
    header += `Content-Type: application/pdf${crlf}${crlf}`;

    const footer = `${crlf}--${boundary}--${crlf}`;

    const payload = Buffer.concat([
      Buffer.from(header, 'utf8'),
      fileBuffer,
      Buffer.from(footer, 'utf8')
    ]);

    const req = https.request({
      hostname: 'www.zohoapis.com',
      path: `/crm/v2/Deals/${dealId}/Attachments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getZohoAttachments(token, dealId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.zohoapis.com',
      path: `/crm/v2/Deals/${dealId}/Attachments`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = await getAccessToken();
  console.log('Access token obtained.');

  const dealId = '6638590000147582001';

  // Minimal valid PDF binary
  const samplePdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n',
    'utf-8'
  );

  console.log('\n--- 1. UPLOADING SAMPLE FLOOR PLAN PDF ATTACHMENT ("GoodEarth_Floor_Plan_V1.pdf") ---');
  const upRes1 = await uploadAttachment(token, dealId, 'GoodEarth_Floor_Plan_V1.pdf', samplePdf);
  console.log('Upload V1 Status:', upRes1.status);
  console.log('Upload V1 Result:', JSON.stringify(upRes1.data, null, 2));

  console.log('\n--- 2. UPLOADING SECOND FLOOR PLAN PDF ATTACHMENT ("GoodEarth_Floor_Plan_V2.pdf") ---');
  const upRes2 = await uploadAttachment(token, dealId, 'GoodEarth_Floor_Plan_V2.pdf', samplePdf);
  console.log('Upload V2 Status:', upRes2.status);
  console.log('Upload V2 Result:', JSON.stringify(upRes2.data, null, 2));

  console.log('\n--- 3. FETCHING DEAL ATTACHMENTS FROM ZOHO CRM ---');
  const attRes = await getZohoAttachments(token, dealId);
  console.log(`Status: ${attRes.status}`);
  console.log('Attachments Response:', JSON.stringify(attRes.data, null, 2));
}

main().catch(console.error);
