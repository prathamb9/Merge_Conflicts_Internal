# CredChain — Blockchain-Based Tamper-Proof Academic Credential Verification

**SIH 2026 • Problem Statement PS-03**

CredChain is a full-stack web application that issues, secures, and verifies academic credentials using cryptographic hashing, digital signatures, and an immutable hash-chain ledger. Even a single character change in a credential record is instantly detected.

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, JavaScript) |
| Database | SQLite (Prisma ORM) — swappable to PostgreSQL |
| Auth | NextAuth.js (Credentials, JWT, role-based) |
| Crypto | SHA-256 hashing, Ed25519 digital signatures |
| UI | Tailwind CSS, Lucide React icons |
| QR | QR code generation for instant verification |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database (migration + seed data)
npx prisma migrate dev --name init

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Institution (IITB) | `admin@iitb.ac.in` | `password123` |
| Institution (IITD) | `admin@iitd.ac.in` | `password123` |

## 📋 Features

### For Institutions
- **Issue Credentials** — Multi-step form with animated crypto process
- **Revoke Credentials** — Append REVOKE block to ledger
- **Dashboard** — Masonry stats, degree charts, recent credentials
- **Ledger Explorer** — Visual blockchain with integrity verification

### For Verifiers (Public)
- **Instant Verification** — No login required
- **QR Code Scanning** — Scan to verify any credential
- **Tamper Detection** — Shows exactly which fields were modified

### Judge Demo Mode (`/demo`)
1. Issue a credential
2. Verify with QR → see "VERIFIED"
3. Tamper the CGPA in database
4. Re-verify → see "VERIFICATION FAILED" with tampered fields
5. Revoke the credential → new REVOKE block appended

## 🔐 Cryptographic Architecture

```
Credential Data → Canonical JSON → SHA-256 Hash → Ed25519 Signature
                                         ↓
                               Ledger Block (chained)
                               previousHash + credentialHash + timestamp
                                         ↓
                               SHA-256(blockData) = currentHash
```

- **Canonical Serialization**: Keys sorted alphabetically, deterministic JSON
- **Digital Signature**: Ed25519 private key signs the credential hash
- **Hash Chain**: Each block links to the previous via `previousHash`
- **Genesis Block**: `previousHash = "0"`

## 📁 Project Structure

```
credchain/
├── prisma/
│   ├── schema.prisma      # Database schema (7 models)
│   ├── seed.js             # Demo data seed script
│   └── migrations/         # SQLite migrations
├── scripts/
│   └── generate-keys.js    # Ed25519 key pair generator
├── src/
│   ├── app/
│   │   ├── page.js                          # Landing page
│   │   ├── login/page.js                    # Login
│   │   ├── verify/page.js                   # Public verification
│   │   ├── institution/
│   │   │   ├── dashboard/page.js            # Dashboard
│   │   │   ├── credentials/page.js          # Credential list
│   │   │   ├── credentials/new/page.js      # Issue credential
│   │   │   ├── credentials/[id]/page.js     # Credential detail
│   │   │   └── ledger/page.js               # Ledger explorer
│   │   ├── demo/
│   │   │   ├── page.js                      # Demo hub
│   │   │   └── tamper/page.js               # Tamper simulator
│   │   └── api/                             # API routes
│   ├── lib/
│   │   ├── crypto.js                        # SHA-256, Ed25519
│   │   ├── ledger.js                        # Hash-chain engine
│   │   ├── credential-engine.js             # Issue/verify/revoke
│   │   ├── prisma.js                        # DB client
│   │   └── auth.js                          # NextAuth config
│   └── components/
│       └── AuthProvider.js                  # Session wrapper
└── .env.example
```

## 🎨 Design Language

- **Colors**: Deep Indigo `#243B53`, Sage Green `#6B8F71`, Terracotta `#C96B4B`, Warm Cream `#F7F3EA`
- **Typography**: DM Sans (UI), Playfair Display (editorial accents)
- **Style**: Pinterest × Premium University Portal aesthetic

## 📝 Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
INSTITUTION_PRIVATE_KEY="..."
INSTITUTION_PUBLIC_KEY="..."
```

Generate keys with: `node scripts/generate-keys.js`
