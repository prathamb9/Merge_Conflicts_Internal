/**
 * CredChain - Credential Engine
 * High-level workflows: issue, revoke, verify credentials.
 */

import { prisma } from "./prisma";
import {
  canonicalSerialize,
  computeHash,
  signHash,
  verifySignature,
} from "./crypto";
import { appendBlock } from "./ledger";

/**
 * Build canonical credential data object for hashing.
 * @param {Object} credential - The credential record
 * @param {Object} student - The student record
 * @param {Object} institution - The institution record
 * @returns {Object} Canonical data object
 */
function buildCanonicalData(credential, student, institution) {
  return {
    credentialNumber: credential.credentialNumber,
    studentId: student.studentId,
    registrationNumber: student.registrationNumber,
    studentName: student.user?.name || "",
    institutionCode: institution.code,
    institutionName: institution.name,
    degree: credential.degree,
    specialization: credential.specialization || "",
    cgpa: credential.cgpa,
    issuedAt: credential.issuedAt.toISOString(),
  };
}

/**
 * Issue a new credential with cryptographic securing.
 * @param {Object} params
 * @param {string} params.studentId - Student record ID
 * @param {string} params.institutionId - Institution record ID
 * @param {string} params.issuerId - User ID of the issuer
 * @param {string} params.degree - Degree title
 * @param {string} params.specialization - Specialization (optional)
 * @param {number} params.cgpa - CGPA value
 * @returns {Promise<Object>} The issued credential with hash and block info
 */
export async function issueCredential({
  studentId,
  institutionId,
  issuerId,
  degree,
  specialization,
  cgpa,
}) {
  // Generate unique credential number
  const count = await prisma.credential.count();
  const credentialNumber = `CRED-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, "0")}`;

  // Create credential record
  const credential = await prisma.credential.create({
    data: {
      credentialNumber,
      degree,
      specialization,
      cgpa: parseFloat(cgpa),
      studentId,
      institutionId,
      status: "ACTIVE",
    },
    include: {
      student: { include: { user: true } },
      institution: true,
    },
  });

  // Build canonical data and compute hash
  const canonicalData = buildCanonicalData(
    credential,
    credential.student,
    credential.institution
  );
  const canonicalJson = canonicalSerialize(canonicalData);
  const credentialHash = computeHash(canonicalJson);

  // Sign the hash
  const privateKey = process.env.INSTITUTION_PRIVATE_KEY;
  const signature = privateKey ? signHash(credentialHash, privateKey) : "DEMO_SIGNATURE";

  // Store hash record
  await prisma.credentialHash.create({
    data: {
      credentialId: credential.id,
      canonicalData: canonicalJson,
      credentialHash,
      signature,
    },
  });

  // Append to ledger
  const block = await appendBlock({
    credentialId: credential.id,
    action: "ISSUE",
    credentialHash,
    issuerId,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "CREDENTIAL_ISSUED",
      entityType: "Credential",
      entityId: credential.id,
      performedBy: issuerId,
      details: `Issued credential ${credentialNumber} to ${credential.student.user.name}`,
    },
  });

  return { credential, credentialHash, block };
}

/**
 * Revoke a credential.
 * @param {string} credentialId - The credential to revoke
 * @param {string} reason - Reason for revocation
 * @param {string} issuerId - User ID of the revoker
 * @returns {Promise<Object>} Updated credential and new block
 */
export async function revokeCredential(credentialId, reason, issuerId) {
  const credential = await prisma.credential.update({
    where: { id: credentialId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedReason: reason,
    },
    include: {
      credentialHash: true,
      student: { include: { user: true } },
    },
  });

  // Append REVOKE block
  const block = await appendBlock({
    credentialId: credential.id,
    action: "REVOKE",
    credentialHash: credential.credentialHash.credentialHash,
    issuerId,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "CREDENTIAL_REVOKED",
      entityType: "Credential",
      entityId: credential.id,
      performedBy: issuerId,
      details: `Revoked credential ${credential.credentialNumber}. Reason: ${reason}`,
    },
  });

  return { credential, block };
}

/**
 * Re-issue a revoked credential.
 * @param {string} credentialId - The credential to re-issue
 * @param {string} issuerId - User ID of the issuer
 * @returns {Promise<Object>} Updated credential and new block
 */
export async function reissueCredential(credentialId, issuerId) {
  const credential = await prisma.credential.update({
    where: { id: credentialId },
    data: {
      status: "ACTIVE",
      revokedAt: null,
      revokedReason: null,
    },
    include: {
      credentialHash: true,
      student: { include: { user: true } },
    },
  });

  // Append ISSUE block for re-issuance
  const block = await appendBlock({
    credentialId: credential.id,
    action: "ISSUE",
    credentialHash: credential.credentialHash.credentialHash,
    issuerId,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "CREDENTIAL_ISSUED",
      entityType: "Credential",
      entityId: credential.id,
      performedBy: issuerId,
      details: `Re-issued credential ${credential.credentialNumber}.`,
    },
  });

  return { credential, block };
}

/**
 * Edit a credential's data fields (e.g., CGPA correction).
 * Re-hashes, re-signs, updates the ledger, and records a revision.
 * @param {Object} params
 * @param {string} params.credentialId - The credential to edit
 * @param {Object} params.updates - Fields to update: { degree, specialization, cgpa }
 * @param {string} params.reason - Reason for the edit
 * @param {string} params.editorId - User ID of the editor
 * @returns {Promise<Object>} Updated credential, revision, and new block
 */
export async function editCredential({ credentialId, updates, reason, editorId }) {
  // 1. Fetch current credential with relations
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: {
      student: { include: { user: true } },
      institution: true,
      credentialHash: true,
    },
  });

  if (!credential) throw new Error("Credential not found");
  if (credential.status === "REVOKED") throw new Error("Cannot edit a revoked credential");

  const oldHash = credential.credentialHash?.credentialHash;

  // 2. Record which fields changed
  const changedFields = [];
  if (updates.degree !== undefined && updates.degree !== credential.degree) {
    changedFields.push({ field: "degree", oldValue: credential.degree, newValue: updates.degree });
  }
  if (updates.specialization !== undefined && updates.specialization !== (credential.specialization || "")) {
    changedFields.push({ field: "specialization", oldValue: credential.specialization || "", newValue: updates.specialization });
  }
  if (updates.cgpa !== undefined && parseFloat(updates.cgpa) !== credential.cgpa) {
    changedFields.push({ field: "cgpa", oldValue: credential.cgpa, newValue: parseFloat(updates.cgpa) });
  }

  if (changedFields.length === 0) {
    throw new Error("No changes detected");
  }

  // 3. Update the credential record
  const updateData = {};
  if (updates.degree !== undefined) updateData.degree = updates.degree;
  if (updates.specialization !== undefined) updateData.specialization = updates.specialization;
  if (updates.cgpa !== undefined) updateData.cgpa = parseFloat(updates.cgpa);

  const updatedCredential = await prisma.credential.update({
    where: { id: credentialId },
    data: updateData,
    include: {
      student: { include: { user: true } },
      institution: true,
    },
  });

  // 4. Recompute canonical data and hash
  const canonicalData = buildCanonicalData(
    updatedCredential,
    updatedCredential.student,
    updatedCredential.institution
  );
  const canonicalJson = canonicalSerialize(canonicalData);
  const newHash = computeHash(canonicalJson);

  // 5. Re-sign
  const privateKey = process.env.INSTITUTION_PRIVATE_KEY;
  const signature = privateKey ? signHash(newHash, privateKey) : "DEMO_SIGNATURE";

  // 6. Update CredentialHash record
  await prisma.credentialHash.update({
    where: { credentialId },
    data: {
      canonicalData: canonicalJson,
      credentialHash: newHash,
      signature,
    },
  });

  // 7. Append EDIT block to ledger
  const block = await appendBlock({
    credentialId,
    action: "EDIT",
    credentialHash: newHash,
    issuerId: editorId,
  });

  // 8. Create CredentialRevision snapshot
  const revisionCount = await prisma.credentialRevision.count({ where: { credentialId } });
  const revision = await prisma.credentialRevision.create({
    data: {
      version: revisionCount + 2, // version 1 = original issue, first edit = version 2
      changeReason: reason,
      changedFields: JSON.stringify(changedFields),
      oldHash: oldHash || "",
      newHash,
      credentialId,
      editedById: editorId,
    },
  });

  // 9. Audit log
  await prisma.auditLog.create({
    data: {
      action: "CREDENTIAL_EDITED",
      entityType: "Credential",
      entityId: credentialId,
      performedBy: editorId,
      details: `Edited credential ${credential.credentialNumber}. Reason: ${reason}. Changed: ${changedFields.map(c => c.field).join(", ")}`,
    },
  });

  return { credential: updatedCredential, revision, block };
}

/**
 * Verify a credential's integrity.
 * Checks: hash match, signature validity, ledger presence, revocation status.
 * @param {string} credentialId - The credential ID to verify
 * @returns {Promise<Object>} Detailed verification result
 */
export async function verifyCredential(credentialId) {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: {
      student: { include: { user: true } },
      institution: true,
      credentialHash: true,
      ledgerBlocks: { orderBy: { blockIndex: "asc" } },
    },
  });

  if (!credential) {
    return {
      verified: false,
      credential: null,
      checks: {
        exists: false,
        hashMatch: false,
        signatureValid: false,
        ledgerIntact: false,
        notRevoked: false,
      },
      error: "Credential not found",
    };
  }

  const result = {
    verified: true,
    credential,
    checks: {
      exists: true,
      hashMatch: false,
      signatureValid: false,
      ledgerIntact: false,
      notRevoked: false,
    },
    details: {},
  };

  // 1. Hash match check
  const canonicalData = buildCanonicalData(
    credential,
    credential.student,
    credential.institution
  );
  const canonicalJson = canonicalSerialize(canonicalData);
  const currentHash = computeHash(canonicalJson);
  const storedHash = credential.credentialHash?.credentialHash;

  result.checks.hashMatch = currentHash === storedHash;
  result.details.currentHash = currentHash;
  result.details.storedHash = storedHash;
  result.details.canonicalData = canonicalData;

  if (!result.checks.hashMatch) {
    result.verified = false;
    result.details.hashMismatchReason = "Data has been tampered with";
    // Try to find what changed
    const storedCanonical = credential.credentialHash?.canonicalData;
    if (storedCanonical) {
      try {
        const original = JSON.parse(storedCanonical);
        const current = canonicalData;
        const changes = [];
        for (const key of Object.keys(original)) {
          if (String(original[key]) !== String(current[key])) {
            changes.push({
              field: key,
              original: original[key],
              current: current[key],
            });
          }
        }
        result.details.tamperedFields = changes;
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  // 2. Signature check
  const publicKey = process.env.INSTITUTION_PUBLIC_KEY;
  if (publicKey && storedHash && credential.credentialHash?.signature) {
    result.checks.signatureValid = verifySignature(
      storedHash,
      credential.credentialHash.signature,
      publicKey
    );
  } else {
    // For demo mode without keys, pass if hash matches
    result.checks.signatureValid = result.checks.hashMatch;
  }
  if (!result.checks.signatureValid) result.verified = false;

  // 3. Ledger check
  // Find the latest ISSUE or EDIT block (most recent hash on the chain)
  const latestHashBlock = [...credential.ledgerBlocks].reverse().find(
    (b) => b.action === "ISSUE" || b.action === "EDIT"
  );
  result.checks.ledgerIntact = latestHashBlock?.credentialHash === storedHash;
  result.details.ledgerBlocks = credential.ledgerBlocks.length;
  if (!result.checks.ledgerIntact) result.verified = false;

  // 4. Revocation check
  result.checks.notRevoked = credential.status === "ACTIVE";
  result.details.status = credential.status;
  if (credential.status === "REVOKED") {
    result.details.revokedAt = credential.revokedAt;
    result.details.revokedReason = credential.revokedReason;
  }
  // Note: notRevoked=false doesn't necessarily mean verified=false,
  // it's informational. But we mark it as not verified.
  if (!result.checks.notRevoked) result.verified = false;

  return result;
}

/**
 * Look up a credential by its number or hash.
 * @param {string} query - Credential number or hash
 * @returns {Promise<Object|null>} The credential if found
 */
export async function findCredential(query) {
  // Try by credential number
  let credential = await prisma.credential.findUnique({
    where: { credentialNumber: query },
    select: { id: true },
  });

  if (!credential) {
    // Try by hash
    const hashRecord = await prisma.credentialHash.findFirst({
      where: { credentialHash: query },
      select: { credentialId: true },
    });
    if (hashRecord) {
      credential = { id: hashRecord.credentialId };
    }
  }

  if (!credential) {
    // Try by ID directly
    const directCred = await prisma.credential.findUnique({
      where: { id: query },
      select: { id: true },
    });
    if (directCred) credential = directCred;
  }

  return credential;
}
