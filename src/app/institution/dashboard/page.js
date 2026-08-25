"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Link2,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 className="font-editorial" style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo-dark)" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Overview of your credential operations
          </p>
        </div>
        <Link href="/institution/credentials/new" className="btn btn-primary">
          <Plus size={16} /> Issue Credential
        </Link>
      </div>

      {/* Stats Grid - Masonry style */}
      <div className="masonry-grid stagger-children" style={{ marginBottom: 32 }}>
        {/* Total Issued */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(36, 59, 83, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} color="var(--indigo)" />
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--sage)", fontWeight: 600 }}>
              <TrendingUp size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Total
            </span>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--indigo-dark)", lineHeight: 1 }}>
            {stats?.totalCredentials || 0}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Credentials Issued</p>
        </div>

        {/* Active */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(107, 143, 113, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={22} color="var(--sage)" />
            </div>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--sage-dark)", lineHeight: 1 }}>
            {stats?.activeCredentials || 0}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Active Credentials</p>
        </div>

        {/* Revoked */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(201, 107, 75, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={22} color="var(--terracotta)" />
            </div>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--terracotta-dark)", lineHeight: 1 }}>
            {stats?.revokedCredentials || 0}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Revoked</p>
        </div>

        {/* Students */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(36, 59, 83, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={22} color="var(--indigo)" />
            </div>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--indigo-dark)", lineHeight: 1 }}>
            {stats?.totalStudents || 0}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Enrolled Students</p>
        </div>

        {/* Ledger Blocks */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(36, 59, 83, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Link2 size={22} color="var(--indigo)" />
            </div>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--indigo-dark)", lineHeight: 1 }}>
            {stats?.totalBlocks || 0}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Ledger Blocks</p>
        </div>

        {/* Ledger Integrity */}
        <div className="glass-card" style={{ padding: 28, background: "rgba(107, 143, 113, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "rgba(107, 143, 113, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={22} color="var(--sage)" />
            </div>
          </div>
          <p className="font-editorial" style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--sage-dark)", lineHeight: 1 }}>
            100%
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Ledger Integrity</p>
        </div>
      </div>

      {/* Degree Distribution */}
      {stats?.departmentStats?.length > 0 && (
        <div className="paper-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 20 }}>Credentials by Degree</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.departmentStats.map((dept, i) => {
              const max = Math.max(...stats.departmentStats.map((d) => d.count));
              const pct = (dept.count / max) * 100;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{dept.name}</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{dept.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--cream-dark)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 4,
                        background: `linear-gradient(90deg, var(--indigo), var(--sage))`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Credentials */}
      <div className="paper-card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Recent Credentials</h3>
          <Link href="/institution/credentials" style={{ fontSize: "0.8rem", color: "var(--indigo)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {stats?.recentCredentials?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.recentCredentials.map((cred) => (
              <Link
                key={cred.id}
                href={`/institution/credentials/${cred.id}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)", textDecoration: "none",
                  color: "inherit", transition: "all 0.2s",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cred.student?.user?.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{cred.credentialNumber}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`badge ${cred.status === "ACTIVE" ? "badge-active" : "badge-revoked"}`}>
                    {cred.status}
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(cred.issuedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: 20 }}>
            No credentials issued yet.{" "}
            <Link href="/institution/credentials/new" style={{ color: "var(--indigo)" }}>Issue your first one</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
