/**
 * CredChain - Cryptographic Engine
 * Handles SHA-256 hashing, Ed25519 digital signatures, and canonical serialization.
 */

import crypto from "crypto";

/**
 * Canonically serialize an object for deterministic hashing.
 * Sorts keys alphabetically, removes whitespace.
 * @param {Object} data - The data to serialize
 * @returns {string} Canonical JSON string
 */
export function canonicalSerialize(data) {
  return JSON.stringify(sortKeys(data));
}

/**
 * Recursively sort object keys alphabetically.
 * @param {any} obj
 * @returns {any}
 */
function sortKeys(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortKeys(obj[key]);
      return sorted;
    }, {});
}

/**
 * Compute SHA-256 hash of a string.
 * @param {string} data - The data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function computeHash(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Generate an Ed25519 key pair.
 * @returns {{ publicKey: string, privateKey: string }} Base64-encoded key pair
 */
export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  return {
    publicKey: publicKey.toString("base64"),
    privateKey: privateKey.toString("base64"),
  };
}

/**
 * Sign a hash using Ed25519 private key.
 * @param {string} hash - The hash to sign
 * @param {string} privateKeyBase64 - Base64-encoded private key
 * @returns {string} Base64-encoded signature
 */
export function signHash(hash, privateKeyBase64) {
  const privateKeyDer = Buffer.from(privateKeyBase64, "base64");
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: "der",
    type: "pkcs8",
  });
  const signature = crypto.sign(null, Buffer.from(hash, "utf8"), privateKey);
  return signature.toString("base64");
}

/**
 * Verify an Ed25519 signature.
 * @param {string} hash - The original hash
 * @param {string} signatureBase64 - Base64-encoded signature
 * @param {string} publicKeyBase64 - Base64-encoded public key
 * @returns {boolean} Whether the signature is valid
 */
export function verifySignature(hash, signatureBase64, publicKeyBase64) {
  try {
    const publicKeyDer = Buffer.from(publicKeyBase64, "base64");
    const publicKey = crypto.createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });
    const signature = Buffer.from(signatureBase64, "base64");
    return crypto.verify(null, Buffer.from(hash, "utf8"), publicKey, signature);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

/**
 * Compute the block hash for a ledger block.
 * @param {Object} blockData - { credentialHash, previousHash, timestamp, issuerId, action }
 * @returns {string} SHA-256 hex hash of the block
 */
export function computeBlockHash(blockData) {
  const data = `${blockData.credentialHash}|${blockData.previousHash}|${blockData.timestamp}|${blockData.issuerId}|${blockData.action}`;
  return computeHash(data);
}
