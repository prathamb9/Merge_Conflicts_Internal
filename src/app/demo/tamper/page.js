"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  RotateCcw,
} from "lucide-react";

export default function TamperPage() {
  const [credentials, setCredentials] = useState([]);
  const [selectedCred, setSelectedCred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);
  const [newCgpa, setNewCgpa] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    fetch("/api/credentials?status=ACTIVE")
      .then((res) => res.json())
      .then((data) => {
        setCredentials(data.credentials || []);
        setLoading(false);
      });
  }, []);

  function selectCredential(cred) {
    setSelectedCred(cred);
    setTamperResult(null);
    setVerifyResult(null);
    setNewCgpa((cred.cgpa + 1.2).toFixed(2)); // Suggest a tamperable value
    setRestored(false);
  }

  async function handleTamper() {
    if (!selectedCred || !newCgpa) return;
    setTampering(true);

    const res = await fetch("/api/demo/tamper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId: selectedCred.id,
        field: "cgpa",
        newValue: newCgpa,
      }),
    });

    const data = await res.json();
    setTamperResult(data.tampered);
    setTampering(false);
  }

  async function handleVerify() {
    if (!selectedCred) return;
    setVerifying(true);

    const res = await fetch(`/api/credentials/${selectedCred.id}/verify`, { method: "POST" });
    const data = await res.json();
    setVerifyResult(data);
    setVerifying(false);
  }

  async function handleRestore() {
    if (!tamperResult) return;

    await fetch("/api/demo/tamper", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId: selectedCred.id,
        field: "cgpa",
        originalValue: tamperResult.originalValue,
      }),
    });

    setRestored(true);
    setTamperResult(null);
    setVerifyResult(null);
  }

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 999,
            background: "rgba(229, 62, 62, 0.1)", color: "#C53030",
            fontSize: "0.8rem", fontWeight: 600, marginBottom: 16,
          }}
        >
          <AlertTriangle size={16} /> Tamper Simulator
        </div>
        <h1 className="font-editorial" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--indigo-dark)", marginBottom: 8 }}>
          Database Tamper Test
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto" }}>
          Simulate a malicious modification to a credential record and see how the system detects it.
        </p>
      </div>

      {/* Step 1: Select Credential */}
      <div className="paper-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--indigo)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>1</span>
          Select a Credential to Tamper
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {credentials.slice(0, 5).map((cred) => (
            <div
              key={cred.id}
              onClick={() => selectCredential(cred)}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${selectedCred?.id === cred.id ? "var(--indigo)" : "var(--border-light)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
                background: selectedCred?.id === cred.id ? "rgba(36, 59, 83, 0.04)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cred.student?.user?.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {cred.credentialNumber} • {cred.degree}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="font-editorial" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    CGPA: {cred.cgpa}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Tamper */}
      {selectedCred && !tamperResult && !restored && (
        <div className="paper-card animate-fade-in" style={{ padding: 24, marginBottom: 20, borderLeft: "4px solid var(--terracotta)" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--terracotta)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>2</span>
            Modify the CGPA (Simulate Attack)
          </h3>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Original CGPA
              </label>
              <input className="input" value={selectedCred.cgpa} disabled style={{ background: "var(--cream-dark)" }} />
            </div>
            <div style={{ color: "var(--text-muted)", paddingBottom: 12 }}>→</div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C53030", display: "block", marginBottom: 6 }}>
                Tampered CGPA
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={newCgpa}
                onChange={(e) => setNewCgpa(e.target.value)}
                style={{ borderColor: "var(--terracotta)" }}
              />
            </div>
          </div>
          <button
            onClick={handleTamper}
            className="btn btn-terracotta"
            style={{ marginTop: 16, width: "100%" }}
            disabled={tampering}
          >
            {tampering ? (
              <Loader2 size={16} style={{ animation: "spin-slow 0.8s linear infinite" }} />
            ) : (
              <><Zap size={16} /> Tamper Database Record</>
            )}
          </button>
        </div>
      )}

      {/* Tamper Result */}
      {tamperResult && (
        <div className="paper-card animate-shake" style={{ padding: 24, marginBottom: 20, borderLeft: "4px solid #E53E3E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={24} color="#E53E3E" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#C53030" }}>Database Tampered!</h3>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            {tamperResult.message}
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 12, borderRadius: "var(--radius-md)", background: "rgba(107,143,113,0.08)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--sage-dark)" }}>Original Value</span>
              <p className="font-editorial" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--sage-dark)" }}>
                {tamperResult.originalValue}
              </p>
            </div>
            <div style={{ flex: 1, padding: 12, borderRadius: "var(--radius-md)", background: "rgba(229,62,62,0.08)" }}>
              <span style={{ fontSize: "0.7rem", color: "#C53030" }}>Tampered Value</span>
              <p className="font-editorial" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#C53030" }}>
                {tamperResult.newValue}
              </p>
            </div>
          </div>

          {/* Step 3: Verify */}
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--indigo)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>3</span>
            Now Verify the Tampered Credential
          </h3>
          <button
            onClick={handleVerify}
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={verifying}
          >
            {verifying ? (
              <Loader2 size={16} style={{ animation: "spin-slow 0.8s linear infinite" }} />
            ) : (
              <><Shield size={16} /> Run Verification</>
            )}
          </button>
        </div>
      )}

      {/* Verification Result */}
      {verifyResult && (
        <div className="paper-card animate-slide-up" style={{ padding: 24, marginBottom: 20, borderLeft: `4px solid ${verifyResult.verified ? "var(--sage)" : "#E53E3E"}` }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div className={verifyResult.verified ? "animate-stamp" : "animate-shake"} style={{ display: "inline-block" }}>
              <div className={verifyResult.verified ? "verified-seal" : "failed-seal"} style={{ width: 80, height: 80 }}>
                {verifyResult.verified ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
            </div>
            <h3
              className="font-editorial"
              style={{
                fontSize: "1.4rem", fontWeight: 800, marginTop: 12,
                color: verifyResult.verified ? "var(--sage-dark)" : "#C53030",
              }}
            >
              {verifyResult.verified ? "VERIFIED" : "VERIFICATION FAILED"}
            </h3>
          </div>

          {/* Checks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {Object.entries(verifyResult.checks || {}).map(([key, val]) => (
              <div key={key} className={`check-item ${val ? "check-pass" : "check-fail"}`}>
                {val ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span style={{ textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
              </div>
            ))}
          </div>

          {/* Tampered Fields */}
          {verifyResult.details?.tamperedFields?.length > 0 && (
            <div style={{ background: "rgba(229,62,62,0.05)", padding: 16, borderRadius: "var(--radius-md)", marginBottom: 16 }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#C53030", marginBottom: 8 }}>Tampered Data Detected:</h4>
              {verifyResult.details.tamperedFields.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>{f.field}:</span>
                  <span style={{ color: "var(--sage-dark)", fontWeight: 600 }}>{String(f.original)}</span>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                  <span style={{ color: "#C53030", fontWeight: 600 }}>{String(f.current)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hash comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Stored Hash</span>
              <div className="hash-display" style={{ fontSize: "0.6rem" }}>{verifyResult.details?.storedHash}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Current Hash</span>
              <div className="hash-display" style={{ fontSize: "0.6rem", borderColor: "#E53E3E", background: "rgba(229,62,62,0.05)" }}>
                {verifyResult.details?.currentHash}
              </div>
            </div>
          </div>

          {/* Restore */}
          <button onClick={handleRestore} className="btn btn-ghost" style={{ width: "100%", marginTop: 16 }}>
            <RotateCcw size={16} /> Restore Original Value
          </button>
        </div>
      )}

      {restored && (
        <div className="paper-card animate-fade-in" style={{ padding: 24, textAlign: "center", borderLeft: "4px solid var(--sage)" }}>
          <CheckCircle2 size={32} color="var(--sage)" style={{ marginBottom: 8 }} />
          <h3 style={{ fontWeight: 700, color: "var(--sage-dark)", marginBottom: 8 }}>Original Value Restored</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            The database record has been restored to its original state.
          </p>
        </div>
      )}
    </div>
  );
}
