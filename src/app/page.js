"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Search,
  Lock,
  FileCheck,
  Link2,
  QrCode,
  ArrowRight,
  ChevronRight,
  Fingerprint,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 40px",
          background: "rgba(253, 251, 247, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-light)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--indigo), var(--indigo-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={18} color="white" />
          </div>
          <span className="font-editorial" style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--indigo)" }}>
            CredChain
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/verify" className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
            Verify Credential
          </Link>
          <Link href="/login" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
            Institution Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="animate-fade-in"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "100px 24px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            background: "rgba(107, 143, 113, 0.12)",
            borderRadius: 999,
            color: "var(--sage-dark)",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          <Lock size={14} />
          Blockchain-Secured Verification
        </div>

        <h1
          className="font-editorial"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 800,
            color: "var(--indigo-dark)",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Academic credentials,{" "}
          <span style={{ color: "var(--sage)" }}>verified</span> in seconds.
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Issue tamper-proof digital credentials with cryptographic integrity.
          Every certificate is hashed, signed, and recorded on an immutable ledger.
        </p>

        {/* Verification CTA */}
        <div
          style={{
            maxWidth: 400,
            margin: "0 auto",
            transition: "all 0.3s",
          }}
        >
          <Link
            href="/verify"
            className="btn btn-primary"
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 32px",
              fontSize: "1.1rem",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              width: "100%",
            }}
          >
            <FileCheck size={22} style={{ marginRight: 12 }} />
            Upload PDF to Verify
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        className="stagger-children"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {[
          {
            icon: <Fingerprint size={24} />,
            title: "Cryptographic Hashing",
            desc: "Unique digital fingerprint via SHA-256 serialization.",
            color: "var(--indigo)",
          },
          {
            icon: <FileCheck size={24} />,
            title: "Digital Signatures",
            desc: "Ed25519 signatures to guarantee authorized issuance.",
            color: "var(--sage)",
          },
          {
            icon: <Link2 size={24} />,
            title: "Immutable Ledger",
            desc: "Cryptographically linked blocks prevent tampering.",
            color: "var(--terracotta)",
          },
          {
            icon: <Layers size={24} />,
            title: "Complete Audit Trail",
            desc: "Permanent traceability for all credential actions.",
            color: "var(--sage)",
          },
          {
            icon: <Zap size={24} />,
            title: "Tamper Detection",
            desc: "Immediate visual highlighting of altered data.",
            color: "var(--terracotta)",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass-card"
            style={{ 
              padding: 28, 
              flex: "1 1 280px",
              maxWidth: 340,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: `${feature.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: feature.color,
                marginBottom: 16,
              }}
            >
              {feature.icon}
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>
              {feature.title}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section
        style={{
          background: "var(--indigo-dark)",
          padding: "80px 24px",
          color: "white",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2
            className="font-editorial"
            style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}
          >
            How It Works
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 48, fontSize: "1rem" }}>
            From issuance to verification — every step is cryptographically secured.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 32,
              textAlign: "center",
            }}
          >
            {[
              { step: "01", title: "Issue", desc: "Institution enters student & academic details" },
              { step: "02", title: "Hash", desc: "Data is canonically serialized and SHA-256 hashed" },
              { step: "03", title: "Sign", desc: "Institution's private key creates a digital signature" },
              { step: "04", title: "Record", desc: "New block is chained to the immutable ledger" },
            ].map((s, i) => (
              <div key={i}>
                <div
                  className="font-editorial"
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: "var(--sage-light)",
                    marginBottom: 8,
                  }}
                >
                  {s.step}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2
          className="font-editorial"
          style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo-dark)", marginBottom: 16 }}
        >
          Ready to verify?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Upload a certificate PDF to instantly verify its authenticity.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/verify" className="btn btn-primary" style={{ padding: "14px 28px" }}>
            Verify a Credential <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "32px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} color="var(--text-muted)" />
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
            CredChain
          </span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Contact us: <a href="mailto:credchain911@gmail.com" style={{ color: "var(--indigo)", textDecoration: "none", fontWeight: 500 }}>credchain911@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
