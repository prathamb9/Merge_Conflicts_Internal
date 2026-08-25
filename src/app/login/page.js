"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/institution/dashboard");
    }
  }

  // Quick login for demo
  function handleDemoLogin() {
    setEmail("admin@iitb.ac.in");
    setPassword("password123");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="animate-fade-in" style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--indigo), var(--indigo-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Shield size={22} color="white" />
            </div>
            <span className="font-editorial" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--indigo)" }}>
              CredChain
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="paper-card" style={{ padding: 36 }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28 }}>
            Sign in to your institution portal
          </p>

          {error && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: "var(--radius-md)",
                background: "rgba(229, 62, 62, 0.08)", color: "#C53030",
                fontSize: "0.85rem", marginBottom: 20,
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: 8 }} disabled={loading}>
              {loading ? "Signing in..." : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--border-light)", marginTop: 24, paddingTop: 20, textAlign: "center" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>Demo Credentials</p>
            <button onClick={handleDemoLogin} className="btn btn-ghost" style={{ fontSize: "0.8rem", width: "100%" }}>
              Fill Demo Login (admin@iitb.ac.in)
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <Link href="/" style={{ color: "var(--indigo)", textDecoration: "none" }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
