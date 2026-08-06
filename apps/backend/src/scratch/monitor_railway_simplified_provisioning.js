const { execSync } = require('child_process');

async function checkRailwayLogs() {
  try {
    const logs = execSync('railway logs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = logs.split('\n');
    const startedLine = lines.find(l => l.includes('Started PostSalesApplication') || l.includes('Started PostsalesBackendApplication') || l.includes('JVM running for'));
    return { logs: lines.slice(-20).join('\n'), started: !!startedLine, startedLine };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('=== MONITORING RAILWAY DEPLOYMENT FOR COMMIT 46437bf ===');
  let attempt = 0;
  while (attempt < 30) {
    attempt++;
    const status = await checkRailwayLogs();
    console.log(`[Attempt ${attempt}] Checked Railway status...`);
    if (status.started) {
      console.log('\n===============================================================');
      console.log('SUCCESS! Spring Boot Application started successfully on Railway!');
      console.log('Startup Log:', status.startedLine);
      console.log('===============================================================');
      return;
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}

main().catch(console.error);
