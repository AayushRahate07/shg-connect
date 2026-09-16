import { exportLedgerData, importLedgerData } from './db';

const PBKDF2_ITERATIONS = 100000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM CryptoKey from a user passcode and salt using PBKDF2
 */
async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedBackupPayload {
  app: 'SHGConnect';
  format: 'SHGCONNECT_ENCRYPTED_BACKUP_V1';
  exportedAt: string;
  salt: string;        // Base64
  iv: string;          // Base64
  ciphertext: string;  // Base64
}

/**
 * Exports and encrypts SHGConnect ledger data using AES-256-GCM
 */
export async function exportEncryptedLedgerData(passcode?: string): Promise<string> {
  const jsonStr = await exportLedgerData();
  const cleanPasscode = passcode?.trim();

  if (!cleanPasscode) {
    return jsonStr; // Plaintext JSON fallback if no passcode entered
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const derivedKey = await deriveKey(cleanPasscode, salt);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(jsonStr);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encodedData
  );

  const encryptedPayload: EncryptedBackupPayload = {
    app: 'SHGConnect',
    format: 'SHGCONNECT_ENCRYPTED_BACKUP_V1',
    exportedAt: new Date().toISOString(),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };

  return JSON.stringify(encryptedPayload, null, 2);
}

/**
 * Decrypts and imports an encrypted or plaintext SHGConnect backup JSON file
 */
export async function importEncryptedLedgerData(fileContent: string, passcode?: string): Promise<{ success: boolean; requiresPasscode?: boolean; message?: string }> {
  try {
    const parsed = JSON.parse(fileContent);

    // Check if file is an encrypted payload
    if (parsed && parsed.format === 'SHGCONNECT_ENCRYPTED_BACKUP_V1') {
      const cleanPasscode = passcode?.trim();
      if (!cleanPasscode) {
        return { success: false, requiresPasscode: true, message: 'Passcode required to decrypt this backup file.' };
      }

      const salt = new Uint8Array(base64ToArrayBuffer(parsed.salt));
      const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
      const ciphertext = base64ToArrayBuffer(parsed.ciphertext);

      const derivedKey = await deriveKey(cleanPasscode, salt);

      let decryptedBuffer: ArrayBuffer;
      try {
        decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          derivedKey,
          ciphertext
        );
      } catch (decryptErr) {
        return { success: false, message: 'Incorrect passcode. Decryption failed.' };
      }

      const decoder = new TextDecoder();
      const plaintextJson = decoder.decode(decryptedBuffer);

      const success = await importLedgerData(plaintextJson);
      return { success, message: success ? 'Encrypted backup state restored successfully!' : 'Invalid decrypted payload structure.' };
    }

    // Plaintext backup import fallback
    const success = await importLedgerData(fileContent);
    return { success, message: success ? 'Backup state restored successfully!' : 'Invalid backup JSON file.' };
  } catch (err) {
    console.error("Failed to parse or decrypt backup file:", err);
    return { success: false, message: 'Corrupted backup file format.' };
  }
}
