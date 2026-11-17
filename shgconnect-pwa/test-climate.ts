import { runClimateTests } from './src/services/__tests__/climate.test';

async function main() {
  console.log('Running Climate Resilience Test Suite...\n');
  const { passed, failed, results } = await runClimateTests();
  results.forEach(r => {
    console.log(`[${r.status}] ${r.test}`);
    if (r.details) console.log(`      Details: ${r.details}`);
  });
  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
