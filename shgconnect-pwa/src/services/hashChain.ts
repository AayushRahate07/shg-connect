import { Transaction, ChainVerificationResult, ChainVerificationBlockResult } from '../types/shg';

/**
 * Calculates SHA-256 hash string for a transaction block payload
 */
export async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates payload string representation for a block
 */
export function getBlockPayloadString(tx: Partial<Transaction>): string {
  return `${tx.memberId || ''}:${tx.memberName || ''}:${tx.type || ''}:${tx.amount || 0}:${tx.notes || ''}`;
}

/**
 * Computes block hash given block parameters
 * BlockHash = SHA256(index + prevHash + timestamp + payload)
 */
export async function computeBlockHash(
  index: number,
  prevHash: string,
  timestamp: string,
  payload: string
): Promise<string> {
  const rawString = `${index}|${prevHash}|${timestamp}|${payload}`;
  return await calculateSHA256(rawString);
}

/**
 * Verifies the full cryptographic hash-chain integrity locally.
 */
export async function verifyLedgerIntegrity(chain: Transaction[]): Promise<ChainVerificationResult> {
  if (!chain || chain.length === 0) {
    return {
      isValid: true,
      invalidBlockIndex: null,
      verifiedBlocksCount: 0,
      blocks: []
    };
  }

  const results: ChainVerificationBlockResult[] = [];
  let chainValid = true;
  let firstInvalidIndex: number | null = null;

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    const expectedPrevHash = i === 0 ? "GENESIS_BLOCK_00000000000000000000000000000000" : chain[i - 1].hash;

    const payload = getBlockPayloadString(block);
    const recomputedHash = await computeBlockHash(block.index, expectedPrevHash, block.timestamp, payload);

    const isPrevHashMatching = block.prevHash === expectedPrevHash;
    const isHashMatching = block.hash === recomputedHash;
    const isBlockValid = isPrevHashMatching && isHashMatching;

    if (!isBlockValid && chainValid) {
      chainValid = false;
      firstInvalidIndex = block.index;
    }

    results.push({
      index: block.index,
      expectedHash: recomputedHash,
      actualHash: block.hash,
      status: isBlockValid ? 'VALID' : 'CORRUPTED',
      payloadSummary: `${block.type} by ${block.memberName} (₹${block.amount})`
    });
  }

  return {
    isValid: chainValid,
    invalidBlockIndex: firstInvalidIndex,
    verifiedBlocksCount: chain.length,
    blocks: results
  };
}
