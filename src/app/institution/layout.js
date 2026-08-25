"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileText,
  FilePlus,
  Link2,
  LogOut,
  FlaskConical,
  Users,
} from "lucide-react";

export default function InstitutionLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  const links = [
    { href: "/institution/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/institution/credentials", label: "Credentials", icon: <FileText size={18} /> },
    { href: "/institution/credentials/new", label: "Issue New", icon: <FilePlus size={18} /> },
    { href: "/institution/ledger", label: "Ledger Explorer", icon: <Link2 size={18} /> },
  ];

  return (
    <div className="sidebar-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Shield size={16} color="white" />
            </div>
            <span className="font-editorial" style={{ fontSize: "1.15rem", fontWeight: 700, color: "white" }}>
              CredChain
            </span>
          </Link>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginLeft: 42 }}>
            {session.user.institutionName || "Institution Portal"}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ padding: "8px 14px", marginBottom: 8 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>{session.user.name}</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="sidebar-link"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ padding: "32px 40px", minHeight: "100vh", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
