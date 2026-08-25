"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function PrintCredentialPage() {
  const { id } = useParams();
  const [credential, setCredential] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredential() {
      try {
        const res = await fetch(`/api/credentials/${id}`);
        const data = await res.json();
        
        if (data.credential) {
          setCredential(data.credential);
          // Generate QR
          const qrPayload = JSON.stringify({
            institution: data.credential.institution?.code,
            credentialId: data.credential.credentialNumber,
            hash: data.credential.credentialHash?.credentialHash || "",
          });
          const qr = await QRCode.toDataURL(qrPayload, {
            width: 180,
            margin: 2,
            color: { dark: "#243B53", light: "#FDFBF7" },
          });
          setQrUrl(qr);
        }
      } catch (err) {
        console.error("Failed to load credential for print", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCredential();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!credential) return <div>Credential not found</div>;

  return (
    <div style={{ padding: "40px", width: "100%", height: "100%", background: "#FDFBF7" }}>
      <div id="certificate-container" className="certificate" style={{ margin: "0 auto", width: "100%", maxWidth: "1000px" }}>
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

          {/* QR Code */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
            {qrUrl && (
              <img src={qrUrl} alt="Verification QR" style={{ width: 80, height: 80 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
