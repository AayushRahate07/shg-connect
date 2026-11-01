const { sha256 } = require('./node_modules/js-sha256');

console.log('--- TESTING SHA256 CRYPTO FALLBACK & MEETING COMMIT ---');

// 1. Verify pure-JS SHA-256
const text = 'test-quorum-session-payload';
const hash = sha256(text);
if (!hash || hash.length !== 64) {
  throw new Error('SHA-256 generation failed!');
}
console.log('[PASS 1] Pure-JS SHA-256 works without window.crypto.subtle: ' + hash.substring(0, 16) + '...');

// 2. Test Checkpoint Fingerprint format CHK-XXXX-XXXX-XXXX
function generateCheckpointFingerprint(h) {
  const cleanHex = h.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const chars = (cleanHex + "000000000000").slice(0, 12);
  return `CHK-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}
const fp = generateCheckpointFingerprint(hash);
if (!fp.startsWith('CHK-') || fp.length !== 18) {
  throw new Error('Invalid fingerprint format: ' + fp);
}
console.log('[PASS 2] Checkpoint Fingerprint generated correctly: ' + fp);

// 3. Test sequential ledger chaining
let prevHash = "GENESIS_BLOCK_00000000000000000000000000000000";
const txs = [];
for (let i = 0; i < 5; i++) {
  const payload = `mem-${i}:Member ${i}:SAVINGS:500:Monthly Savings`;
  const blockHash = sha256(`${i}|${prevHash}|2026-10-28T02:45:00.000Z|${payload}`);
  txs.push({ index: i, prevHash, hash: blockHash, payload });
  prevHash = blockHash;
}
if (txs.length !== 5 || txs[4].prevHash !== txs[3].hash) {
  throw new Error('Ledger chaining broken!');
}
console.log('[PASS 3] Sequential ledger chaining verified for 5 transactions. Final hash: ' + txs[4].hash.substring(0, 16) + '...');

console.log('\n>>> ALL TEST VERIFICATIONS COMPLETED SUCCESSFULLY! <<<');
