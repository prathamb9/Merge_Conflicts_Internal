/**
 * CredChain - Ledger Engine
 * Manages the hash-chain ledger: appending blocks, verifying chain integrity.
 */

import { prisma } from "./prisma";
import { computeBlockHash } from "./crypto";

/**
 * Get the latest block in the ledger.
 * @returns {Promise<Object|null>} The latest ledger block or null if empty
 */
export async function getLatestBlock() {
  return prisma.ledgerBlock.findFirst({
    orderBy: { blockIndex: "desc" },
  });
}

/**
 * Append a new block to the ledger chain.
 * @param {Object} params
 * @param {string} params.credentialId - ID of the credential
 * @param {string} params.action - ISSUE, REVOKE, or REISSUE
 * @param {string} params.credentialHash - SHA-256 hash of the credential
 * @param {string} params.issuerId - ID of the issuing user
 * @returns {Promise<Object>} The newly created ledger block
 */
export async function appendBlock({ credentialId, action, credentialHash, issuerId }) {
  const latestBlock = await getLatestBlock();

  const blockIndex = latestBlock ? latestBlock.blockIndex + 1 : 0;
  const previousHash = latestBlock ? latestBlock.currentHash : "0";
  const timestamp = new Date().toISOString();

  const currentHash = computeBlockHash({
    credentialHash,
    previousHash,
    timestamp,
    issuerId,
    action,
  });

  const block = await prisma.ledgerBlock.create({
    data: {
      blockIndex,
      action,
      credentialHash,
      previousHash,
      currentHash,
      timestamp: new Date(timestamp),
      credentialId,
      issuerId,
    },
  });

  return block;
}

/**
 * Verify the integrity of the entire ledger chain.
 * Recalculates every block hash and checks chain linkage.
 * @returns {Promise<Object>} Integrity report
 */
export async function verifyChainIntegrity() {
  const blocks = await prisma.ledgerBlock.findMany({
    orderBy: { blockIndex: "asc" },
  });

  if (blocks.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      checkedBlocks: 0,
      errors: [],
    };
  }

  const errors = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Check block index continuity
    if (block.blockIndex !== i) {
      errors.push({
        blockIndex: block.blockIndex,
        expected: i,
        error: `Block index mismatch: expected ${i}, got ${block.blockIndex}`,
      });
    }

    // Check previous hash linkage
    if (i === 0) {
      if (block.previousHash !== "0") {
        errors.push({
          blockIndex: block.blockIndex,
          error: `Genesis block previousHash should be "0", got "${block.previousHash}"`,
        });
      }
    } else {
      if (block.previousHash !== blocks[i - 1].currentHash) {
        errors.push({
          blockIndex: block.blockIndex,
          error: `Previous hash mismatch: expected "${blocks[i - 1].currentHash}", got "${block.previousHash}"`,
        });
      }
    }

    // Recalculate current hash and verify
    const recalculatedHash = computeBlockHash({
      credentialHash: block.credentialHash,
      previousHash: block.previousHash,
      timestamp: block.timestamp.toISOString(),
      issuerId: block.issuerId,
      action: block.action,
    });

    if (recalculatedHash !== block.currentHash) {
      errors.push({
        blockIndex: block.blockIndex,
        error: `Hash mismatch: stored "${block.currentHash.substring(0, 16)}...", recalculated "${recalculatedHash.substring(0, 16)}..."`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    totalBlocks: blocks.length,
    checkedBlocks: blocks.length,
    errors,
  };
}

/**
 * Get all ledger blocks with credential info.
 * @returns {Promise<Array>} All ledger blocks
 */
export async function getAllBlocks() {
  return prisma.ledgerBlock.findMany({
    orderBy: { blockIndex: "asc" },
    include: {
      credential: {
        include: {
          student: true,
          institution: true,
        },
      },
      issuer: {
        select: { name: true, email: true },
      },
    },
  });
}
