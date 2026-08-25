"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Fingerprint,
  FileCheck,
  Link2,
  ShieldCheck,
  Loader2,
} from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (initialQuery) {
      handleVerify(initialQuery);
    }
  }, []);

  async function handleVerify(q) {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to connect to verification server" });
    } finally {
      setLoading(false);
    }
  }

  const checks = result?.checks;
  const verified = result?.verified;

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
        <Link href="/" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="font-editorial" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--indigo-dark)", marginBottom: 8 }}>
            Verify a Credential
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Enter a credential number, ID, or SHA-256 hash. No login required.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
          style={{
            display: "flex",
            background: "var(--warm-white)",
            borderRadius: "var(--radius-lg)",
            border: "2px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px", color: "var(--text-muted)" }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="CRED-XXXX-0001, credential ID, or hash..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, padding: "16px 0", border: "none", outline: "none",
              fontSize: "0.95rem", background: "transparent", color: "var(--text-primary)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 0, padding: "16px 24px" }} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" style={{ animation: "spin-slow 0.8s linear infinite" }} /> : "Verify"}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Running cryptographic verification...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="animate-slide-up">
            {result.error && !result.checks ? (
              <div className="paper-card" style={{ padding: 32, textAlign: "center" }}>
                <AlertTriangle size={48} color="var(--terracotta)" style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>{result.error}</h3>
              </div>
            ) : (
              <>
                {/* Seal */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div className={verified ? "animate-stamp" : "animate-shake"} style={{ display: "inline-block" }}>
                    <div className={verified ? "verified-seal" : "failed-seal"}>
                      {verified ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                    </div>
                  </div>
                  <h2
                    className="font-editorial"
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      marginTop: 16,
                      color: verified ? "var(--sage-dark)" : "#C53030",
                    }}
                  >
                    {verified ? "VERIFIED" : "VERIFICATION FAILED"}
                  </h2>
                  {!verified && result.details?.tamperedFields?.length > 0 && (
                    <p style={{ color: "#C53030", fontSize: "0.9rem", marginTop: 8 }}>
                      Tampering detected — data has been modified
                    </p>
                  )}
                </div>

                {/* Credential Info */}
                {result.credential && (
                  <div className="paper-card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                      Credential Details
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Student</span>
                        <p style={{ fontWeight: 600 }}>{result.credential.student?.user?.name}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Credential No.</span>
                        <p style={{ fontWeight: 600 }}>{result.credential.credentialNumber}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Degree</span>
                        <p style={{ fontWeight: 600 }}>{result.credential.degree}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CGPA</span>
                        <p style={{ fontWeight: 600 }}>{result.credential.cgpa}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Institution</span>
                        <p style={{ fontWeight: 600 }}>{result.credential.institution?.name}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Status</span>
                        <span className={`badge ${result.credential.status === "ACTIVE" ? "badge-active" : "badge-revoked"}`}>
                          {result.credential.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Checks */}
                <div className="paper-card" style={{ padding: 24, marginBottom: 20 }}>
                  <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                    Verification Checks
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "exists", label: "Credential Exists", icon: <FileCheck size={18} /> },
                      { key: "hashMatch", label: "Hash Fingerprint Matches", icon: <Fingerprint size={18} /> },
                      { key: "signatureValid", label: "Digital Signature Valid", icon: <ShieldCheck size={18} /> },
                      { key: "ledgerIntact", label: "Ledger Chain Intact", icon: <Link2 size={18} /> },
                      { key: "notRevoked", label: "Not Revoked", icon: <CheckCircle2 size={18} /> },
                    ].map((check) => (
                      <div
                        key={check.key}
                        className={`check-item ${checks?.[check.key] ? "check-pass" : "check-fail"}`}
                      >
                        {checks?.[check.key] ? (
                          <CheckCircle2 size={18} color="var(--sage)" />
                        ) : (
                          <XCircle size={18} color="#C53030" />
                        )}
                        {check.icon}
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tampered Fields */}
                {result.details?.tamperedFields?.length > 0 && (
                  <div className="paper-card" style={{ padding: 24, marginBottom: 20, border: "2px solid #E53E3E" }}>
                    <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#C53030", marginBottom: 12 }}>
                      ⚠ Tampered Data Detected
                    </h3>
                    {result.details.tamperedFields.map((field, i) => (
                      <div key={i} style={{ padding: "10px 0", borderBottom: i < result.details.tamperedFields.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C53030", textTransform: "capitalize" }}>
                          {field.field}
                        </span>
                        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "var(--sage-dark)" }}>Original</span>
                            <p style={{ fontWeight: 700, color: "var(--sage-dark)" }}>{String(field.original)}</p>
                          </div>
                          <div style={{ color: "var(--text-muted)", alignSelf: "center" }}>→</div>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "#C53030" }}>Tampered</span>
                            <p style={{ fontWeight: 700, color: "#C53030" }}>{String(field.current)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hash Details */}
                {result.details && (
                  <div className="paper-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                      Cryptographic Proof
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Stored Hash</span>
                        <div className="hash-display">{result.details.storedHash || "N/A"}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Computed Hash (Current Data)</span>
                        <div
                          className="hash-display"
                          style={{
                            borderColor: result.checks?.hashMatch ? "var(--sage-light)" : "#E53E3E",
                            background: result.checks?.hashMatch ? "rgba(107,143,113,0.05)" : "rgba(229,62,62,0.05)",
                          }}
                        >
                          {result.details.currentHash || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
