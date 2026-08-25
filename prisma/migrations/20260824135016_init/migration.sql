-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Institution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialNumber" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "specialization" TEXT,
    "cgpa" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "revokedReason" TEXT,
    "reissuedFromId" TEXT,
    "studentId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    CONSTRAINT "Credential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Credential_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CredentialHash" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalData" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialId" TEXT NOT NULL,
    CONSTRAINT "CredentialHash_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockIndex" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    CONSTRAINT "LedgerBlock_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedgerBlock_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT NOT NULL,
    CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_userId_key" ON "Institution"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_credentialNumber_key" ON "Credential"("credentialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialHash_credentialId_key" ON "CredentialHash"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerBlock_blockIndex_key" ON "LedgerBlock"("blockIndex");
