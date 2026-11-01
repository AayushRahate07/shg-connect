"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/hashChain.ts
var hashChain_exports = {};
__export(hashChain_exports, {
  calculateSHA256: () => calculateSHA256,
  computeBlockHash: () => computeBlockHash,
  computeCheckpointHash: () => computeCheckpointHash,
  computeSessionMerkleRoot: () => computeSessionMerkleRoot,
  generateCheckpointFingerprint: () => generateCheckpointFingerprint,
  getBlockPayloadString: () => getBlockPayloadString,
  validateAndClampTimestamp: () => validateAndClampTimestamp,
  verifyLedgerIntegrity: () => verifyLedgerIntegrity
});
module.exports = __toCommonJS(hashChain_exports);

// node_modules/js-sha256/src/node.mjs
var import_crypto = require("crypto");

// node_modules/js-sha256/src/shared.mjs
var INPUT_ERROR = "input is invalid type";
var FINALIZE_ERROR = "finalize already called";
var ARRAY_BUFFER = typeof ArrayBuffer !== "undefined";
var formatMessage = function(message) {
  var type = typeof message;
  if (type === "string") {
    return [message, true];
  }
  if (Array.isArray(message)) {
    return [message, false];
  }
  if (ARRAY_BUFFER && message) {
    if (message.constructor === ArrayBuffer) {
      return [new Uint8Array(message), false];
    } else if (ArrayBuffer.isView(message)) {
      return [message, false];
    }
  }
  throw new Error(INPUT_ERROR);
};

// node_modules/js-sha256/src/node.mjs
function toNodeInput(message) {
  const [msg, isString] = formatMessage(message);
  return isString ? Buffer.from(msg, "utf8") : Buffer.from(msg);
}
var NodeHasher = class {
  constructor(hash) {
    this.hash = hash;
    this.result = void 0;
  }
  update(message) {
    if (this.result) {
      throw new Error(FINALIZE_ERROR);
    }
    this.hash.update(toNodeInput(message));
    return this;
  }
  finalize() {
    if (!this.result) {
      this.result = this.hash.digest();
      this.hash = void 0;
    }
  }
  hex() {
    this.finalize();
    return this.result.toString("hex");
  }
  toString() {
    return this.hex();
  }
  array() {
    this.finalize();
    return Array.from(this.result);
  }
  digest() {
    return this.array();
  }
  arrayBuffer() {
    return Uint8Array.from(this.array()).buffer;
  }
};
function addOutputMethods(method, createHasher) {
  method.hex = method;
  method.array = function(...args) {
    return createHasher(...args.slice(0, -1)).update(args[args.length - 1]).array();
  };
  method.digest = method.array;
  method.arrayBuffer = function(...args) {
    return createHasher(...args.slice(0, -1)).update(args[args.length - 1]).arrayBuffer();
  };
  return method;
}
function createNodeMethod(algorithm) {
  const createHasher = () => new NodeHasher((0, import_crypto.createHash)(algorithm));
  const method = function(message) {
    return createHasher().update(message).hex();
  };
  addOutputMethods(method, createHasher);
  method.create = createHasher;
  method.update = function(message) {
    return method.create().update(message);
  };
  return method;
}
function createNodeHmacMethod(algorithm) {
  const createHasher = (key) => new NodeHasher((0, import_crypto.createHmac)(algorithm, toNodeInput(key)));
  const method = function(key, message) {
    return createHasher(key).update(message).hex();
  };
  addOutputMethods(method, createHasher);
  method.create = createHasher;
  method.update = function(key, message) {
    return method.create(key).update(message);
  };
  return method;
}
var sha256 = createNodeMethod("sha256");
var sha224 = createNodeMethod("sha224");
sha256.sha256 = sha256;
sha256.sha224 = sha224;
sha256.hmac = createNodeHmacMethod("sha256");
sha224.hmac = createNodeHmacMethod("sha224");

// src/services/hashChain.ts
async function calculateSHA256(text) {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (_e) {
  }
  return sha256(text);
}
async function computeSessionMerkleRoot(txHashes) {
  if (!txHashes || txHashes.length === 0) {
    return await calculateSHA256("EMPTY_SESSION_TRANSACTIONS");
  }
  let currentLevel = [...txHashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
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
async function computeCheckpointHash(localIndex, prevBlockHash, merkleRoot, signatoryProof) {
  const rawString = `${localIndex}|${prevBlockHash}|${merkleRoot}|${signatoryProof}`;
  return await calculateSHA256(rawString);
}
function generateCheckpointFingerprint(hash) {
  if (!hash) return "CHK-0000-0000-0000";
  const cleanHex = hash.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  const chars = (cleanHex + "000000000000").slice(0, 12);
  return `CHK-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}
function getBlockPayloadString(tx) {
  const base = `${tx.memberId || ""}:${tx.memberName || ""}:${tx.type || ""}:${tx.amount || 0}:${tx.notes || ""}`;
  if (tx.signatories && tx.signatories.length > 0) {
    const signerRoles = tx.signatories.map((s) => s.role).join(",");
    return `${base}:SIGNERS=[${signerRoles}]:SALT=${tx.signatureProof || ""}`;
  }
  return base;
}
async function computeBlockHash(index, prevHash, timestamp, payload) {
  const rawString = `${index}|${prevHash}|${timestamp}|${payload}`;
  return await calculateSHA256(rawString);
}
async function verifyLedgerIntegrity(chain) {
  if (!chain || chain.length === 0) {
    return {
      isValid: true,
      invalidBlockIndex: null,
      verifiedBlocksCount: 0,
      blocks: []
    };
  }
  const results = [];
  let chainValid = true;
  let firstInvalidIndex = null;
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
      status: isBlockValid ? "VALID" : "CORRUPTED",
      payloadSummary: `${block.type} by ${block.memberName} (\u20B9${block.amount})`,
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
function validateAndClampTimestamp(rawPhysicalTimestampMs, prevBlockTimestampMs) {
  if (rawPhysicalTimestampMs < prevBlockTimestampMs) {
    return {
      validTimestampMs: prevBlockTimestampMs + 1e3,
      wasClamped: true,
      reason: "Physical clock was earlier than previous block. Monotonically clamped forward by +1s."
    };
  }
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;
  const maxAllowedFuture = prevBlockTimestampMs + 48 * 60 * 60 * 1e3;
  if (rawPhysicalTimestampMs > maxAllowedFuture && !isOnline) {
    return {
      validTimestampMs: prevBlockTimestampMs + 60 * 1e3,
      // 1-minute forward advance
      wasClamped: true,
      reason: "Physical clock skewed >48h into future while offline. Clamped to +1min after previous block."
    };
  }
  return {
    validTimestampMs: rawPhysicalTimestampMs,
    wasClamped: false
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateSHA256,
  computeBlockHash,
  computeCheckpointHash,
  computeSessionMerkleRoot,
  generateCheckpointFingerprint,
  getBlockPayloadString,
  validateAndClampTimestamp,
  verifyLedgerIntegrity
});
