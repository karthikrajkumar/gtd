/**
 * Example: Programmatic GTD usage in a Node.js script
 */

import { GTD } from 'get-things-done-sdk';

async function main() {
  const gtd = new GTD({
    projectDir: process.cwd(),
    autoMode: true,
    format: 'enterprise',
    maxBudgetUsd: 10.0,
  });

  // Subscribe to events
  gtd.on((event) => {
    console.log(`[${event.type}]`, JSON.stringify(event.data));
  });

  // 1. Scan the codebase
  console.log('Scanning...');
  const scan = await gtd.scan();
  console.log(`Scanned ${scan.filesIndexed} files`);

  // 2. Generate TDD
  console.log('Generating TDD...');
  const tdd = await gtd.generateDocument('tdd');
  console.log(`TDD saved to ${tdd.outputPath}`);

  // 3. Check drift
  console.log('Checking drift...');
  const drift = await gtd.detectDrift();
  console.log(`Drift items: ${drift.totalItems}`);

  // 4. Get full status
  const status = await gtd.getStatus();
  console.log('Pipeline status:', JSON.stringify(status, null, 2));
}

main().catch(console.error);
