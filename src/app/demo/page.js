"use client";

import Link from "next/link";
import {
  FileCheck,
  QrCode,
  AlertTriangle,
  Search,
  XCircle,
  ArrowRight,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

const DEMO_STEPS = [
  {
    step: 1,
    title: "Issue a Credential",
    desc: "Go to the credential issuance page and create a new credential for a student. Watch the cryptographic securing process.",
    link: "/institution/credentials/new",
    linkLabel: "Issue Credential",
    icon: <FileCheck size={24} />,
    color: "var(--sage)",
  },
  {
    step: 2,
    title: "Verify with QR",
    desc: "After issuance, scan the generated QR code or use the credential ID to verify. You should see 'VERIFIED' with all checks passing.",
    link: "/verify",
    linkLabel: "Open Verifier",
    icon: <QrCode size={24} />,
    color: "var(--indigo)",
  },
  {
    step: 3,
    title: "Tamper the Database",
    desc: "Use the Tamper Simulator to maliciously modify the CGPA in the raw database. This simulates a database-level attack.",
    link: "/demo/tamper",
    linkLabel: "Open Tamper Simulator",
    icon: <AlertTriangle size={24} />,
    color: "var(--terracotta)",
  },
  {
    step: 4,
    title: "Detect the Compromise",
    desc: "Run verification again. The system will detect the mismatch, show the tampered fields, and display mismatched hashes.",
    link: "/verify",
    linkLabel: "Re-Verify",
    icon: <Search size={24} />,
    color: "#C53030",
  },
  {
    step: 5,
    title: "Revoke the Credential",
    desc: "Revoke the tampered credential. A new REVOKE block is appended to the ledger, maintaining the complete audit trail.",
    link: "/institution/credentials",
    linkLabel: "View Credentials",
    icon: <XCircle size={24} />,
    color: "var(--terracotta)",
  },
];

export default function DemoPage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 999,
            background: "rgba(201, 107, 75, 0.1)", color: "var(--terracotta-dark)",
            fontSize: "0.8rem", fontWeight: 600, marginBottom: 16,
          }}
        >
          <FlaskConical size={16} /> Judge Demo Mode
        </div>
        <h1 className="font-editorial" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--indigo-dark)", marginBottom: 8 }}>
          SIH PS-03 Demo Sequence
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 500, margin: "0 auto" }}>
          Follow these 5 steps to demonstrate the tamper-proof credential verification system in 3-5 minutes.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {DEMO_STEPS.map((s) => (
          <div key={s.step} className="paper-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: "var(--radius-md)",
                  background: `${s.color}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", color: s.color, flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    className="font-editorial"
                    style={{ fontSize: "0.85rem", fontWeight: 700, color: s.color }}
                  >
                    Step {s.step}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                  {s.desc}
                </p>
                <Link href={s.link} className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
                  {s.linkLabel} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
