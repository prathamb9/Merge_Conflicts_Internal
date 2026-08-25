/**
 * CredChain - Database Seed Script
 * Populates the database with realistic demo data.
 * Run: npx prisma db seed
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ---- Crypto helpers (inline for seed script) ----
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

function canonicalSerialize(data) {
  return JSON.stringify(sortKeys(data));
}

function computeHash(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function computeBlockHash(blockData) {
  const data = `${blockData.credentialHash}|${blockData.previousHash}|${blockData.timestamp}|${blockData.issuerId}|${blockData.action}`;
  return computeHash(data);
}

// Generate Ed25519 keys for the demo
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  return {
    publicKey: publicKey.toString("base64"),
    privateKey: privateKey.toString("base64"),
  };
}

function signHash(hash, privateKeyBase64) {
  const privateKeyDer = Buffer.from(privateKeyBase64, "base64");
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: "der",
    type: "pkcs8",
  });
  const signature = crypto.sign(null, Buffer.from(hash, "utf8"), privateKey);
  return signature.toString("base64");
}

async function main() {
  console.log("🌱 Seeding CredChain database...\n");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.ledgerBlock.deleteMany();
  await prisma.credentialHash.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.student.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.user.deleteMany();

  // Generate signing keys
  const keys = generateKeyPair();
  console.log("🔑 Generated Ed25519 key pair");
  console.log(`   Set these in your .env file:`);
  console.log(`   INSTITUTION_PRIVATE_KEY="${keys.privateKey}"`);
  console.log(`   INSTITUTION_PUBLIC_KEY="${keys.publicKey}"\n`);

  const passwordHash = await bcrypt.hash("password123", 10);

  // ---- Create Institution Users ----
  const iitbUser = await prisma.user.create({
    data: {
      name: "Dr. Rajesh Kumar",
      email: "admin@iitb.ac.in",
      passwordHash,
      role: "INSTITUTION",
    },
  });

  const iitdUser = await prisma.user.create({
    data: {
      name: "Prof. Meera Sharma",
      email: "admin@iitd.ac.in",
      passwordHash,
      role: "INSTITUTION",
    },
  });

  // ---- Create Institutions ----
  const iitb = await prisma.institution.create({
    data: {
      name: "Indian Institute of Technology Bombay",
      code: "IITB",
      address: "Powai, Mumbai, Maharashtra 400076",
      userId: iitbUser.id,
    },
  });

  const iitd = await prisma.institution.create({
    data: {
      name: "Indian Institute of Technology Delhi",
      code: "IITD",
      address: "Hauz Khas, New Delhi 110016",
      userId: iitdUser.id,
    },
  });

  console.log("🏛  Created 2 institutions: IITB, IITD");

  // ---- Create Students ----
  const studentData = [
    { name: "Aarav Patel", email: "aarav@iitb.ac.in", studentId: "IITB-CS-2022-001", regNum: "22CS1001", dept: "Computer Science", inst: iitb },
    { name: "Priya Singh", email: "priya@iitb.ac.in", studentId: "IITB-CS-2022-002", regNum: "22CS1002", dept: "Computer Science", inst: iitb },
    { name: "Rohan Mehta", email: "rohan@iitb.ac.in", studentId: "IITB-ECE-2022-003", regNum: "22EC1003", dept: "Electronics & Communication", inst: iitb },
    { name: "Ananya Iyer", email: "ananya@iitb.ac.in", studentId: "IITB-ME-2022-004", regNum: "22ME1004", dept: "Mechanical Engineering", inst: iitb },
    { name: "Vikram Desai", email: "vikram@iitb.ac.in", studentId: "IITB-CS-2022-005", regNum: "22CS1005", dept: "Computer Science", inst: iitb },
    { name: "Sneha Nair", email: "sneha@iitd.ac.in", studentId: "IITD-CS-2022-001", regNum: "22CS2001", dept: "Computer Science", inst: iitd },
    { name: "Arjun Reddy", email: "arjun@iitd.ac.in", studentId: "IITD-ECE-2022-002", regNum: "22EC2002", dept: "Electronics & Communication", inst: iitd },
    { name: "Kavya Krishnan", email: "kavya@iitd.ac.in", studentId: "IITD-CE-2022-003", regNum: "22CE2003", dept: "Civil Engineering", inst: iitd },
    { name: "Rahul Gupta", email: "rahul@iitd.ac.in", studentId: "IITD-AI-2022-004", regNum: "22AI2004", dept: "AI & Machine Learning", inst: iitd },
    { name: "Diya Sharma", email: "diya@iitd.ac.in", studentId: "IITD-CS-2022-005", regNum: "22CS2005", dept: "Computer Science", inst: iitd },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: "STUDENT",
      },
    });
    const student = await prisma.student.create({
      data: {
        studentId: s.studentId,
        registrationNumber: s.regNum,
        department: s.dept,
        userId: user.id,
        institutionId: s.inst.id,
      },
    });
    students.push({ ...student, user, institution: s.inst });
  }

  console.log(`👩‍🎓 Created ${students.length} students`);

  // ---- Issue Credentials ----
  const credentialConfigs = [
    { studentIdx: 0, degree: "B.Tech Computer Science", spec: "Artificial Intelligence", cgpa: 8.72, inst: iitb, issuer: iitbUser },
    { studentIdx: 1, degree: "B.Tech Computer Science", spec: "Data Science", cgpa: 9.15, inst: iitb, issuer: iitbUser },
    { studentIdx: 2, degree: "B.Tech Electronics & Communication", spec: "VLSI Design", cgpa: 8.34, inst: iitb, issuer: iitbUser },
    { studentIdx: 3, degree: "B.Tech Mechanical Engineering", spec: "Robotics", cgpa: 7.89, inst: iitb, issuer: iitbUser },
    { studentIdx: 4, degree: "M.Tech Computer Science", spec: "Cybersecurity", cgpa: 9.41, inst: iitb, issuer: iitbUser },
    { studentIdx: 5, degree: "B.Tech Computer Science", spec: "Cloud Computing", cgpa: 8.56, inst: iitd, issuer: iitdUser },
    { studentIdx: 6, degree: "B.Tech Electronics & Communication", spec: "Signal Processing", cgpa: 7.92, inst: iitd, issuer: iitdUser },
    { studentIdx: 7, degree: "B.Tech Civil Engineering", spec: "Structural Engineering", cgpa: 8.11, inst: iitd, issuer: iitdUser },
    { studentIdx: 8, degree: "M.Tech AI & Machine Learning", spec: "Deep Learning", cgpa: 9.28, inst: iitd, issuer: iitdUser },
    { studentIdx: 9, degree: "B.Tech Computer Science", spec: "Web Technologies", cgpa: 8.67, inst: iitd, issuer: iitdUser },
    // Extra credentials for some students
    { studentIdx: 0, degree: "M.Tech AI & Machine Learning", spec: "Reinforcement Learning", cgpa: 9.33, inst: iitb, issuer: iitbUser },
    { studentIdx: 1, degree: "PhD Computer Science", spec: "Natural Language Processing", cgpa: 9.52, inst: iitb, issuer: iitbUser },
  ];

  let blockIndex = 0;
  let previousHash = "0";

  for (let i = 0; i < credentialConfigs.length; i++) {
    const config = credentialConfigs[i];
    const student = students[config.studentIdx];
    const credNum = `CRED-${(Date.now() + i).toString(36).toUpperCase()}-${(i + 1).toString().padStart(4, "0")}`;

    const issuedAt = new Date(Date.now() - (credentialConfigs.length - i) * 86400000);

    // Create credential
    const credential = await prisma.credential.create({
      data: {
        credentialNumber: credNum,
        degree: config.degree,
        specialization: config.spec,
        cgpa: config.cgpa,
        status: "ACTIVE",
        issuedAt,
        studentId: student.id,
        institutionId: config.inst.id,
      },
    });

    // Build canonical data
    const canonicalData = {
      cgpa: config.cgpa,
      credentialNumber: credNum,
      degree: config.degree,
      institutionCode: config.inst === iitb ? "IITB" : "IITD",
      institutionName: config.inst === iitb ? "Indian Institute of Technology Bombay" : "Indian Institute of Technology Delhi",
      issuedAt: issuedAt.toISOString(),
      registrationNumber: student.registrationNumber,
      specialization: config.spec,
      studentId: student.studentId,
      studentName: student.user.name,
    };

    const canonicalJson = canonicalSerialize(canonicalData);
    const credentialHash = computeHash(canonicalJson);
    const signature = signHash(credentialHash, keys.privateKey);

    // Create hash record
    await prisma.credentialHash.create({
      data: {
        credentialId: credential.id,
        canonicalData: canonicalJson,
        credentialHash,
        signature,
      },
    });

    // Create ledger block
    const timestamp = issuedAt.toISOString();
    const currentHash = computeBlockHash({
      credentialHash,
      previousHash,
      timestamp,
      issuerId: config.issuer.id,
      action: "ISSUE",
    });

    await prisma.ledgerBlock.create({
      data: {
        blockIndex,
        action: "ISSUE",
        credentialHash,
        previousHash,
        currentHash,
        timestamp: issuedAt,
        credentialId: credential.id,
        issuerId: config.issuer.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CREDENTIAL_ISSUED",
        entityType: "Credential",
        entityId: credential.id,
        performedBy: config.issuer.id,
        details: `Seeded credential ${credNum} for ${student.user.name}`,
        timestamp: issuedAt,
      },
    });

    previousHash = currentHash;
    blockIndex++;

    console.log(`  📜 Issued: ${credNum} → ${student.user.name} (${config.degree}, CGPA: ${config.cgpa})`);
  }

  // ---- Revoke 2 credentials ----
  const credToRevoke = await prisma.credential.findFirst({
    where: { degree: "B.Tech Electronics & Communication", institution: { code: "IITD" } },
    include: { credentialHash: true },
  });

  if (credToRevoke) {
    await prisma.credential.update({
      where: { id: credToRevoke.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: "Academic misconduct detected during final examination",
      },
    });

    const revokeTimestamp = new Date().toISOString();
    const revokeHash = computeBlockHash({
      credentialHash: credToRevoke.credentialHash.credentialHash,
      previousHash,
      timestamp: revokeTimestamp,
      issuerId: iitdUser.id,
      action: "REVOKE",
    });

    await prisma.ledgerBlock.create({
      data: {
        blockIndex,
        action: "REVOKE",
        credentialHash: credToRevoke.credentialHash.credentialHash,
        previousHash,
        currentHash: revokeHash,
        timestamp: new Date(),
        credentialId: credToRevoke.id,
        issuerId: iitdUser.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREDENTIAL_REVOKED",
        entityType: "Credential",
        entityId: credToRevoke.id,
        performedBy: iitdUser.id,
        details: "Revoked due to academic misconduct",
      },
    });

    previousHash = revokeHash;
    blockIndex++;

    console.log(`  ❌ Revoked: ${credToRevoke.credentialNumber}`);
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${credentialConfigs.length} credentials issued`);
  console.log(`   ${blockIndex} ledger blocks created`);
  console.log(`   1 credential revoked`);
  console.log(`\n🔑 Demo login: admin@iitb.ac.in / password123`);
  console.log(`   Alt login:  admin@iitd.ac.in / password123\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
