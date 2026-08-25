"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Shield,
  Copy,
  AlertTriangle,
  Loader2,
  Download,
  Edit3,
  History,
  GitCommit,
} from "lucide-react";

export default function CredentialDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ degree: "", specialization: "", cgpa: "", reason: "" });
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    fetchCredential();
  }, [id]);

  async function fetchCredential() {
    const res = await fetch(`/api/credentials/${id}`);
    const data = await res.json();
    setCredential(data.credential);
    setLoading(false);

    // Generate QR
    if (typeof window !== "undefined") {
      try {
        const QRCode = (await import("qrcode")).default;
        const qrPayload = JSON.stringify({
          institution: data.credential?.institution?.code,
          credentialId: data.credential?.credentialNumber,
          hash: data.credential?.credentialHash?.credentialHash || "",
        });
        const qr = await QRCode.toDataURL(qrPayload, {
          width: 200,
          margin: 2,
          color: { dark: "#243B53", light: "#FDFBF7" },
        });
        setQrUrl(qr);
      } catch (e) {
        console.error("QR generation failed:", e);
      }
    }
  }

  async function handleVerify() {
    setVerifying(true);
    const res = await fetch(`/api/credentials/${id}/verify`, { method: "POST" });
    const data = await res.json();
    setVerifyResult(data);
    setVerifying(false);
  }

  async function handleRevoke() {
    setRevoking(true);
    const res = await fetch(`/api/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REVOKE", reason: revokeReason }),
    });
    if (res.ok) {
      setShowRevokeModal(false);
      fetchCredential();
    }
    setRevoking(false);
  }

  async function handleReissue() {
    const res = await fetch(`/api/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REISSUE" }),
    });
    if (res.ok) {
      fetchCredential();
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function openEditModal() {
    setEditForm({
      degree: credential.degree,
      specialization: credential.specialization || "",
      cgpa: String(credential.cgpa),
      reason: "",
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editForm.reason.trim()) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/credentials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          updates: {
            degree: editForm.degree,
            specialization: editForm.specialization,
            cgpa: editForm.cgpa,
          },
          reason: editForm.reason,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchCredential();
      } else {
        const data = await res.json();
        alert(data.error || "Edit failed");
      }
    } catch (err) {
      alert("Failed to edit credential");
    }
    setEditing(false);
  }

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" /></div>;
  }

  if (!credential) {
    return <div style={{ textAlign: "center", padding: 80 }}><h2>Credential not found</h2></div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => router.back()} className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={`/credentials/${id}`}
            target="_blank"
            className="btn btn-ghost"
            style={{ fontSize: "0.8rem" }}
          >
            Public View ↗
          </a>
          <button
            onClick={() => {
              window.location.href = `/api/credentials/${id}/pdf`;
            }}
            className="btn btn-primary"
            style={{ fontSize: "0.8rem" }}
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* Certificate View */}
        <div id="cert-view" className="certificate">
          <div className="certificate-pattern" />
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
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
                Student ID: {credential.student?.studentId}
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
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Issued</p>
                <p style={{ fontWeight: 600, fontSize: "1rem" }}>
                  {new Date(credential.issuedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>



            {/* QR Code */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
              {qrUrl && (
                <img src={qrUrl} alt="Verification QR" style={{ width: 80, height: 80 }} />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Crypto Proof */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* QR Code */}
          {qrUrl && (
            <div className="paper-card" style={{ padding: 20, textAlign: "center" }}>
              <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
                Verification QR
              </h3>
              <img src={qrUrl} alt="QR Code" style={{ width: 160, height: 160, margin: "0 auto" }} />
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 8 }}>Scan to verify this credential</p>
            </div>
          )}

          {/* Actions */}
          <div className="paper-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={handleVerify} className="btn btn-sage" style={{ width: "100%" }} disabled={verifying}>
                {verifying ? <Loader2 size={16} style={{ animation: "spin-slow 0.8s linear infinite" }} /> : <><Shield size={16} /> Verify Integrity</>}
              </button>
              {credential.status === "ACTIVE" && (
                <button onClick={openEditModal} className="btn btn-primary" style={{ width: "100%" }}>
                  <Edit3 size={16} /> Edit Credential
                </button>
              )}
              {credential.status === "ACTIVE" && (
                <button onClick={() => setShowRevokeModal(true)} className="btn btn-danger" style={{ width: "100%" }}>
                  <XCircle size={16} /> Revoke
                </button>
              )}
              {credential.status === "REVOKED" && (
                <button onClick={handleReissue} className="btn btn-primary" style={{ width: "100%", background: "var(--sage)", borderColor: "var(--sage)" }}>
                  <CheckCircle2 size={16} /> Re-issue
                </button>
              )}
            </div>
          </div>

          {/* Change History Timeline */}
          {credential.revisions && credential.revisions.length > 0 && (
            <div className="paper-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <History size={14} /> Change History
              </h3>
              <div style={{ position: "relative" }}>
                {/* Timeline line */}
                <div style={{ position: "absolute", left: 10, top: 4, bottom: 4, width: 2, background: "var(--border)" }} />
                {credential.revisions.map((rev, i) => {
                  let changes = [];
                  try { changes = JSON.parse(rev.changedFields); } catch(e) {}
                  return (
                    <div key={rev.id} style={{ display: "flex", gap: 16, marginBottom: 20, position: "relative" }}>
                      {/* Dot */}
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                        <GitCommit size={12} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--indigo-dark)" }}>Version {rev.version}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(rev.editedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                          {rev.changeReason}
                        </p>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>by {rev.editedBy?.name}</div>
                        {changes.map((c, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", padding: "3px 0" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{c.field}:</span>
                            <span style={{ color: "#C53030", textDecoration: "line-through" }}>{String(c.oldValue)}</span>
                            <span style={{ color: "var(--text-muted)" }}>→</span>
                            <span style={{ color: "var(--sage-dark)", fontWeight: 600 }}>{String(c.newValue)}</span>
                          </div>
                        ))}
                        <div className="hash-display" style={{ fontSize: "0.6rem", marginTop: 4 }}>
                          {rev.newHash}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Original Issue marker */}
                <div style={{ display: "flex", gap: 16, position: "relative" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                    <CheckCircle2 size={12} color="white" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--sage-dark)" }}>Version 1 — Original Issue</span>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {new Date(credential.issuedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verifyResult && (
            <div className="paper-card animate-fade-in" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {verifyResult.verified ? (
                  <CheckCircle2 size={20} color="var(--sage)" />
                ) : (
                  <XCircle size={20} color="#C53030" />
                )}
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: verifyResult.verified ? "var(--sage-dark)" : "#C53030" }}>
                  {verifyResult.verified ? "Integrity Verified" : "Integrity Compromised"}
                </h3>
              </div>
              {Object.entries(verifyResult.checks || {}).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: "0.8rem" }}>
                  {val ? <CheckCircle2 size={14} color="var(--sage)" /> : <XCircle size={14} color="#C53030" />}
                  <span style={{ textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hash Info */}
          <div className="paper-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>
              Cryptographic Proof
            </h3>
            {credential.credentialHash && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Credential Hash (SHA-256)</span>
                <div className="hash-display" style={{ cursor: "pointer" }} onClick={() => copyToClipboard(credential.credentialHash.credentialHash)}>
                  {credential.credentialHash.credentialHash}
                </div>
              </div>
            )}
            {credential.ledgerBlocks?.map((block, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Block #{block.blockIndex} • {block.action}
                </span>
                <div className="hash-display" style={{ fontSize: "0.65rem" }}>
                  {block.currentHash}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="modal-overlay" onClick={() => setShowRevokeModal(false)}>
          <div className="modal-content" style={{ padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
              <AlertTriangle size={20} color="var(--terracotta)" style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
              Revoke Credential
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>
              This action will mark the credential as revoked and append a REVOKE block to the ledger. This cannot be undone.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Reason for Revocation
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g., Academic misconduct detected"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowRevokeModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleRevoke} className="btn btn-danger" disabled={!revokeReason || revoking}>
                {revoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ padding: 32, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
              <Edit3 size={20} color="var(--indigo)" style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
              Edit Credential
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20 }}>
              Changes will be recorded on the blockchain ledger with full traceability.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Degree</label>
                <input
                  className="input"
                  value={editForm.degree}
                  onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Specialization</label>
                <input
                  className="input"
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>CGPA</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={editForm.cgpa}
                  onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Reason for Change *</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g., CGPA correction after re-evaluation"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleEdit} className="btn btn-primary" disabled={!editForm.reason.trim() || editing}>
                {editing ? "Saving..." : "Save & Record on Ledger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
