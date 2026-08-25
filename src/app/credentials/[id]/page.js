"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  QrCode,
  Fingerprint,
  FileCheck,
  Link2,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function PublicCredentialPage({ params }) {
  const { id } = use(params);
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    fetchCredential();
  }, [id]);

  async function fetchCredential() {
    try {
      const res = await fetch(`/api/credentials/${id}`);
      const data = await res.json();
      setCredential(data.credential);

      // Auto-verify
      const vRes = await fetch(`/api/credentials/${id}/verify`, { method: "POST" });
      const vData = await vRes.json();
      setVerifyResult(vData);

      // Generate QR
      if (typeof window !== "undefined" && data.credential) {
        try {
          const QRCode = (await import("qrcode")).default;
          const url = `${window.location.origin}/verify?q=${data.credential.credentialNumber}`;
          const qr = await QRCode.toDataURL(url, {
            width: 180,
            margin: 2,
            color: { dark: "#243B53", light: "#FDFBF7" },
          });
          setQrUrl(qr);
        } catch (e) {
          console.error("QR generation failed:", e);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleDownloadPDF() {
    try {
      const certEl = document.getElementById("certificate-container");
      if (!certEl) return;

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certEl, {
        scale: 2,
        backgroundColor: "#FDFBF7",
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `${credential.credentialNumber}-certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      // Fallback: print
      window.print();
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!credential) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <XCircle size={48} color="var(--terracotta)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Credential Not Found</h2>
          <Link href="/" style={{ color: "var(--indigo)", textDecoration: "none" }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const verified = verifyResult?.verified;
  const checks = verifyResult?.checks;

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
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--indigo), var(--indigo-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Shield size={18} color="white" />
          </div>
          <span className="font-editorial" style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--indigo)" }}>
            CredChain
          </span>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleDownloadPDF} className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
            <Download size={16} /> Download
          </button>
          <Link href="/verify" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
            Verify Another
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Verification Badge */}
        {verifyResult && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "12px 24px",
              borderRadius: "var(--radius-lg)",
              marginBottom: 24,
              background: verified ? "rgba(107, 143, 113, 0.1)" : "rgba(229, 62, 62, 0.08)",
              border: `1px solid ${verified ? "var(--sage-light)" : "#E53E3E"}`,
            }}
          >
            {verified ? <CheckCircle2 size={20} color="var(--sage)" /> : <XCircle size={20} color="#C53030" />}
            <span style={{ fontWeight: 600, color: verified ? "var(--sage-dark)" : "#C53030" }}>
              {verified ? "This credential has been cryptographically verified" : "Verification failed — this credential may have been tampered with"}
            </span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Certificate */}
          <div id="certificate-container" className="certificate animate-fade-in">
            <div className="certificate-pattern" />
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Seal */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div className="seal-stamp">
                    <div className="seal-stamp-inner">
                      {credential.institution?.code}
                    </div>
                  </div>
                </div>
                <h2 className="font-editorial" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--indigo-dark)" }}>
                  {credential.institution?.name}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {credential.institution?.address}
                </p>
              </div>

              {/* Title */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Certificate of Academic Achievement
                </p>
                <h1 className="font-editorial" style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 4 }}>
                  {credential.degree}
                </h1>
                {credential.specialization && (
                  <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                    Specialization: {credential.specialization}
                  </p>
                )}
              </div>

              {/* Student */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Awarded to</p>
                <h2 className="font-editorial" style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo)" }}>
                  {credential.student?.user?.name}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Student ID: {credential.student?.studentId} • Reg: {credential.student?.registrationNumber}
                </p>
              </div>

              {/* CGPA & Date */}
              <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 32 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>CGPA</p>
                  <p className="font-editorial" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--sage-dark)" }}>
                    {credential.cgpa}
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Issued On</p>
                  <p style={{ fontWeight: 600, fontSize: "1rem" }}>
                    {new Date(credential.issuedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Verification Status */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <span
                  className={`badge ${credential.status === "ACTIVE" ? "badge-active" : "badge-revoked"}`}
                  style={{ fontSize: "0.85rem", padding: "6px 16px" }}
                >
                  {credential.status}
                </span>
              </div>

              {/* QR and Credential Number */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
                {qrUrl && (
                  <img src={qrUrl} alt="Verification QR" style={{ width: 80, height: 80 }} />
                )}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Credential Number</p>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{credential.credentialNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Crypto Proof */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Verification Checks */}
            {verifyResult && (
              <div className="paper-card animate-fade-in" style={{ padding: 20 }}>
                <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                  Verification Status
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { key: "exists", label: "Credential Exists", icon: <FileCheck size={16} /> },
                    { key: "hashMatch", label: "Hash Matches", icon: <Fingerprint size={16} /> },
                    { key: "signatureValid", label: "Signature Valid", icon: <ShieldCheck size={16} /> },
                    { key: "ledgerIntact", label: "Ledger Intact", icon: <Link2 size={16} /> },
                    { key: "notRevoked", label: "Not Revoked", icon: <CheckCircle2 size={16} /> },
                  ].map((check) => (
                    <div
                      key={check.key}
                      className={`check-item ${checks?.[check.key] ? "check-pass" : "check-fail"}`}
                      style={{ padding: "8px 12px", fontSize: "0.8rem" }}
                    >
                      {checks?.[check.key] ? (
                        <CheckCircle2 size={14} color="var(--sage)" />
                      ) : (
                        <XCircle size={14} color="#C53030" />
                      )}
                      {check.icon}
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code */}
            {qrUrl && (
              <div className="paper-card" style={{ padding: 20, textAlign: "center" }}>
                <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                  Scan to Verify
                </h3>
                <img src={qrUrl} alt="QR Code" style={{ width: 140, height: 140, margin: "0 auto" }} />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 8 }}>
                  Points to /verify/{credential.credentialNumber}
                </p>
              </div>
            )}

            {/* Hash Details */}
            <div className="paper-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                Cryptographic Proof
              </h3>
              {credential.credentialHash && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Credential Hash (SHA-256)</span>
                  <div
                    className="hash-display"
                    style={{ cursor: "pointer", fontSize: "0.65rem" }}
                    onClick={() => copyToClipboard(credential.credentialHash.credentialHash)}
                    title="Click to copy"
                  >
                    {credential.credentialHash.credentialHash}
                  </div>
                </div>
              )}
              {credential.credentialHash?.signature && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Digital Signature (Ed25519)</span>
                  <div className="hash-display" style={{ fontSize: "0.6rem" }}>
                    {credential.credentialHash.signature.substring(0, 64)}...
                  </div>
                </div>
              )}
              {credential.ledgerBlocks?.map((block, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Block #{block.blockIndex} — {block.action}
                  </span>
                  <div className="hash-display" style={{ fontSize: "0.6rem" }}>
                    {block.currentHash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
