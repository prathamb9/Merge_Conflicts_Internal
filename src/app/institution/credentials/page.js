"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
} from "lucide-react";

export default function CredentialsListPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeCredId, setRevokeCredId] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, [statusFilter]);

  async function fetchCredentials() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/credentials?${params}`);
    const data = await res.json();
    setCredentials(data.credentials || []);
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchCredentials();
  }

  async function handleRevoke() {
    if (!revokeCredId) return;
    setRevoking(true);
    const res = await fetch(`/api/credentials/${revokeCredId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REVOKE", reason: revokeReason }),
    });
    if (res.ok) {
      setShowRevokeModal(false);
      setRevokeCredId(null);
      setRevokeReason("");
      fetchCredentials(); // refresh list
    }
    setRevoking(false);
  }

  async function handleReissue(credId) {
    const res = await fetch(`/api/credentials/${credId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REISSUE" }),
    });
    if (res.ok) {
      fetchCredentials(); // refresh list
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 className="font-editorial" style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo-dark)" }}>
            Credentials
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            All issued credentials and their verification status
          </p>
        </div>
        <Link href="/institution/credentials/new" className="btn btn-primary">
          <Plus size={16} /> Issue New
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 250 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="input"
              placeholder="Search by name, ID, or degree..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </form>
        <div style={{ display: "flex", gap: 4 }}>
          {["ALL", "ACTIVE", "REVOKED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? "btn btn-primary" : "btn btn-ghost"}
              style={{ fontSize: "0.8rem", padding: "8px 16px" }}
            >
              {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Revoked"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : credentials.length === 0 ? (
        <div className="paper-card" style={{ padding: 60, textAlign: "center" }}>
          <FileText size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>No credentials found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {search ? "Try a different search term" : "Issue your first credential to get started"}
          </p>
        </div>
      ) : (
        <div className="paper-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-light)" }}>
                {["Credential", "Student", "Degree", "CGPA", "Status", "Issued", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <tr
                  key={cred.id}
                  style={{
                    borderBottom: "1px solid var(--border-light)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{cred.credentialNumber}</span>
                    {cred.credentialHash && (
                      <p className="hash-display" style={{ fontSize: "0.65rem", marginTop: 4, padding: "2px 6px" }}>
                        {cred.credentialHash.credentialHash?.substring(0, 16)}...
                      </p>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{cred.student?.user?.name}</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cred.student?.studentId}</p>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "0.85rem" }}>{cred.degree}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="font-editorial" style={{ fontSize: "1rem", fontWeight: 700 }}>{cred.cgpa}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`badge ${cred.status === "ACTIVE" ? "badge-active" : "badge-revoked"}`}>
                      {cred.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(cred.issuedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: "8px" }}>
                    <Link
                      href={`/institution/credentials/${cred.id}`}
                      className="btn btn-ghost"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      <Eye size={14} /> View
                    </Link>
                    {cred.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          setRevokeCredId(cred.id);
                          setShowRevokeModal(true);
                        }}
                        className="btn btn-danger"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        <XCircle size={14} /> Revoke
                      </button>
                    )}
                    {cred.status === "REVOKED" && (
                      <button
                        onClick={() => handleReissue(cred.id)}
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem", background: "var(--sage)", borderColor: "var(--sage)" }}
                      >
                        <CheckCircle2 size={14} /> Re-issue
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="modal-overlay" onClick={() => setShowRevokeModal(false)}>
          <div className="modal-content" style={{ padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
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
    </div>
  );
}
