const https = require('https');
const querystring = require('querystring');

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

function getZohoRecord(token, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.zohoapis.com',
      path: path,
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

  // Deal ID: 6638590000147582001
  const dealId = '6638590000147582001';
  console.log(`\n1. Fetching Deal ${dealId}...`);
  const dealRes = await getZohoRecord(token, `/crm/v2/Deals/${dealId}`);
  console.log('Deal data:', JSON.stringify(dealRes.data, null, 2));
}

main().catch(console.error);
