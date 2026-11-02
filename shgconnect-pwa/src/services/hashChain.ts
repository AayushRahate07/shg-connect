import { Transaction, ChainVerificationResult, ChainVerificationBlockResult } from '../types/shg';
import { sha256 } from 'js-sha256';

/**
 * Calculates SHA-256 hash string for text payload.
 * Uses Web Crypto API when available (HTTPS / localhost),
 * and seamlessly falls back to pure-JS sha256 in insecure HTTP contexts (e.g. mobile LAN IP testing).
 */
export async function calculateSHA256(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_e) {
    // Subtle crypto unavailable or failed, fall through to pure JS
  }
  return sha256(text);
}

/**
 * Computes pair-wise Merkle Session Root hash for a list of transaction hashes.
 * Handles odd leaf counts by pairing the final node with itself.
 */
export async function computeSessionMerkleRoot(txHashes: string[]): Promise<string> {
  if (!txHashes || txHashes.length === 0) {
    return await calculateSHA256("EMPTY_SESSION_TRANSACTIONS");
  }

  let currentLevel = [...txHashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combinedHash = await calculateSHA256(`${left}:${right}`);
      nextLevel.push(combinedHash);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Calculates full 256-bit Checkpoint Hash
 * CheckpointHash = SHA256(localIndex + prevBlockHash + merkleRoot + signatoryProof)
 */
export async function computeCheckpointHash(
  localIndex: number,
  prevBlockHash: string,
  merkleRoot: string,
  signatoryProof: string
): Promise<string> {
  const rawString = `${localIndex}|${prevBlockHash}|${merkleRoot}|${signatoryProof}`;
  return await calculateSHA256(rawString);
}

/**
 * Extracts a 16-character human-readable fingerprint format: "CHK-XXXX-XXXX-XXXX"
 * from a 64-character SHA-256 hash string.
 */
export function generateCheckpointFingerprint(hash: string): string {
  if (!hash) return "CHK-0000-0000-0000";
  const cleanHex = hash.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const chars = (cleanHex + "000000000000").slice(0, 12);
  return `CHK-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/**
 * Creates payload string representation for an append-only audit log block
 */
export function getBlockPayloadString(tx: Partial<Transaction>): string {
  const base = `${tx.memberId || ''}:${tx.memberName || ''}:${tx.type || ''}:${tx.amount || 0}:${tx.notes || ''}`;
  if (tx.signatories && tx.signatories.length > 0) {
    const signerRoles = tx.signatories.map(s => s.role).join(',');
    return `${base}:SIGNERS=[${signerRoles}]:SALT=${tx.signatureProof || ''}`;
  }
  return base;
}

/**
 * Computes block hash given block parameters
 * BlockHash = SHA256(index + prevHash + timestamp + payload)
 */
export function computeBlockHashSync(
  index: number,
  prevHash: string,
  timestamp: string,
  payload: string
): string {
  const rawString = `${index}|${prevHash}|${timestamp}|${payload}`;
  return sha256(rawString);
}

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
 * Verifies the full cryptographic append-only audit log integrity.
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
    const merkleRoot = await computeSessionMerkleRoot([block.hash || recomputedHash]);
    const fingerprint = block.checkpointFingerprint || generateCheckpointFingerprint(recomputedHash);

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
      payloadSummary: `${block.type} by ${block.memberName} (₹${block.amount})`,
      merkleRoot,
      checkpointFingerprint: fingerprint
    });
  }

  return {
    isValid: chainValid,
    invalidBlockIndex: firstInvalidIndex,
    verifiedBlocksCount: chain.length,
    blocks: results
  };
}

/**
 * Causal Defense & Monotonic Time Clamping (Phase 8 Rural Hardening)
 * 
 * Prevents clock tampering, dead-battery resets (1970), and future skews (2028).
 * Ensures that the local ledger ordering is causally sound and strictly monotonic.
 */
export function validateAndClampTimestamp(
  rawPhysicalTimestampMs: number,
  prevBlockTimestampMs: number
): { validTimestampMs: number; wasClamped: boolean; reason?: string } {
  // 1. Clock wound backward protection (dead battery / manual change)
  if (rawPhysicalTimestampMs < prevBlockTimestampMs) {
    return {
      validTimestampMs: prevBlockTimestampMs + 1000,
      wasClamped: true,
      reason: 'Physical clock was earlier than previous block. Monotonically clamped forward by +1s.'
    };
  }

  // 2. Clock wound >48 hours into the future while offline
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
  const maxAllowedFuture = prevBlockTimestampMs + (48 * 60 * 60 * 1000);

  if (rawPhysicalTimestampMs > maxAllowedFuture && !isOnline) {
    return {
      validTimestampMs: prevBlockTimestampMs + (60 * 1000), // 1-minute forward advance
      wasClamped: true,
      reason: 'Physical clock skewed >48h into future while offline. Clamped to +1min after previous block.'
    };
  }

  return {
    validTimestampMs: rawPhysicalTimestampMs,
    wasClamped: false
  };
}
