"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function LedgerPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState(null);

  useEffect(() => {
    fetch("/api/ledger")
      .then((res) => res.json())
      .then((data) => {
        setBlocks(data.blocks || []);
        setLoading(false);
      });
  }, []);

  async function verifyIntegrity() {
    setVerifying(true);
    const res = await fetch("/api/ledger/verify", { method: "POST" });
    const data = await res.json();
    setIntegrityResult(data);
    setVerifying(false);
  }

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 className="font-editorial" style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo-dark)" }}>
            Ledger Explorer
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {blocks.length} blocks in the hash-chain ledger
          </p>
        </div>
        <button onClick={verifyIntegrity} className="btn btn-sage" disabled={verifying}>
          {verifying ? (
            <Loader2 size={16} style={{ animation: "spin-slow 0.8s linear infinite" }} />
          ) : (
            <Shield size={16} />
          )}
          Verify Ledger Integrity
        </button>
      </div>

      {/* Integrity Result */}
      {integrityResult && (
        <div
          className="paper-card animate-fade-in"
          style={{
            padding: 20,
            marginBottom: 24,
            borderLeft: `4px solid ${integrityResult.isValid ? "var(--sage)" : "#E53E3E"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {integrityResult.isValid ? (
              <CheckCircle2 size={24} color="var(--sage)" />
            ) : (
              <XCircle size={24} color="#C53030" />
            )}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: integrityResult.isValid ? "var(--sage-dark)" : "#C53030" }}>
                {integrityResult.isValid ? "Ledger Integrity Verified ✓" : "Integrity Compromised!"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Checked {integrityResult.checkedBlocks} of {integrityResult.totalBlocks} blocks
              </p>
            </div>
          </div>
          {integrityResult.errors?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {integrityResult.errors.map((err, i) => (
                <p key={i} style={{ fontSize: "0.8rem", color: "#C53030", padding: "4px 0" }}>
                  Block #{err.blockIndex}: {err.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div className="paper-card" style={{ padding: 60, textAlign: "center" }}>
          <Link2 size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>No blocks yet</h3>
          <p style={{ color: "var(--text-muted)" }}>Issue a credential to create the genesis block.</p>
        </div>
      ) : (
        <div className="ledger-chain">
          {blocks.map((block, i) => (
            <div key={block.id} className="ledger-block">
              <div className={`ledger-block-dot ${i === 0 ? "genesis" : ""}`} />

              <div
                className="paper-card"
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderLeft: `3px solid ${
                    block.action === "ISSUE" ? "var(--sage)" : block.action === "REVOKE" ? "var(--terracotta)" : "var(--indigo)"
                  }`,
                }}
                onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      className="font-editorial"
                      style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--indigo)", minWidth: 32 }}
                    >
                      #{block.blockIndex}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`badge badge-${block.action.toLowerCase()}`}>
                          {block.action}
                        </span>
                        {i === 0 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--indigo)", fontWeight: 600 }}>GENESIS</span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                        {block.credential?.student?.user?.name || "Unknown"} • {block.credential?.institution?.name}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(block.timestamp).toLocaleString()}
                    </span>
                    {expandedBlock === block.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedBlock === block.id && (
                  <div className="animate-fade-in" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Previous Hash</span>
                        <div className="hash-display" style={{ fontSize: "0.65rem" }}>{block.previousHash}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Current Hash</span>
                        <div className="hash-display" style={{ fontSize: "0.65rem" }}>{block.currentHash}</div>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Credential Hash</span>
                        <div className="hash-display" style={{ fontSize: "0.65rem" }}>{block.credentialHash}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                      Issued by: {block.issuer?.name || "Unknown"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
