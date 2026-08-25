/**
 * CredChain - Key Generation Script
 * Generates Ed25519 key pair for credential signing.
 * Run: node scripts/generate-keys.js
 */

import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

const pubBase64 = publicKey.toString("base64");
const privBase64 = privateKey.toString("base64");

console.log("=== CredChain Ed25519 Key Pair ===\n");
console.log("Add these to your .env file:\n");
console.log(`INSTITUTION_PRIVATE_KEY="${privBase64}"`);
console.log(`INSTITUTION_PUBLIC_KEY="${pubBase64}"`);
console.log("\n=================================");
