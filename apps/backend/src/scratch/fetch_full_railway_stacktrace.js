const { execSync } = require('child_process');

try {
  const logs = execSync('railway logs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  const lines = logs.split('\n');
  console.log('=== RAILWAY LOGS SEARCH FOR EXCEPTION AFTER PROVISIONING ===');
  
  let foundProvisioning = false;
  let linesAfter = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('Provisioning Completed Successfully') || l.includes('ERROR') || l.includes('Exception') || l.includes('JDBC exception')) {
      console.log(`Line ${i}:`, l);
    }
  }
} catch (err) {
  console.error('Error fetching logs:', err.message);
}
