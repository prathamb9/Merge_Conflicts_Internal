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

  async function handleVerify(q, extractedText = null, qrHash = null, pdfData = null) {
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

      // PRIMARY CHECK: PDF Metadata Verification
      // This is the most reliable check — compares data embedded at download time
      // against the current database values
      if (data.verified && pdfData && data.credential) {
        const c = data.credential;
        const tamperedFields = [];

        // Compare hash (detects ANY data change since PDF was generated)
        if (pdfData.hash && c.credentialHash?.credentialHash) {
          if (pdfData.hash !== c.credentialHash.credentialHash) {
            // Hash mismatch — now find which specific fields differ
            if (pdfData.studentName && c.student?.user?.name && pdfData.studentName !== c.student.user.name) {
              tamperedFields.push({ field: "Student Name", original: c.student.user.name, current: pdfData.studentName });
            }
            if (pdfData.degree && c.degree && pdfData.degree !== c.degree) {
              tamperedFields.push({ field: "Degree", original: c.degree, current: pdfData.degree });
            }
            if (pdfData.specialization && c.specialization && pdfData.specialization !== c.specialization) {
              tamperedFields.push({ field: "Branch", original: c.specialization, current: pdfData.specialization });
            }
            if (pdfData.cgpa !== undefined && c.cgpa !== undefined && parseFloat(pdfData.cgpa) !== c.cgpa) {
              tamperedFields.push({ field: "CGPA", original: String(c.cgpa), current: String(pdfData.cgpa) });
            }
            if (pdfData.institutionName && c.institution?.name && pdfData.institutionName !== c.institution.name) {
              tamperedFields.push({ field: "College Name", original: c.institution.name, current: pdfData.institutionName });
            }

            // If no individual field mismatch found, it's a general version mismatch
            if (tamperedFields.length === 0) {
              tamperedFields.push({ field: "Certificate Version", original: "Latest version (updated by institution)", current: "Outdated version from PDF" });
            }

            data.verified = false;
            data.error = "This certificate is outdated — the credential has been updated since this PDF was downloaded";
            data.details = {
              ...data.details,
              outdatedVersion: true,
              tamperedFields,
            };
          }
        }
      }

      // FALLBACK CHECK 1: QR Hash Version Check (for PDFs without metadata)
      if (data.verified && qrHash && data.credential?.credentialHash?.credentialHash) {
        const currentHash = data.credential.credentialHash.credentialHash;
        if (qrHash !== currentHash) {
          data.verified = false;
          data.error = "Outdated certificate detected";
          data.details = {
            ...data.details,
            outdatedVersion: true,
            tamperedFields: [{
              field: "Certificate Version",
              original: "Latest version (updated by institution)",
              current: "Old/outdated version from PDF"
            }],
          };
        }
      }

      // FALLBACK CHECK 2: Visual text tampering (for text-based PDFs)
      if (data.verified && extractedText) {
         const missingFields = [];
         const c = data.credential;
         if (c) {
          const normalize = (str) => String(str).replace(/[^a-z0-9]/gi, "").toLowerCase();
          const normalText = normalize(extractedText);
          
          if (c.student?.user?.name && !normalText.includes(normalize(c.student.user.name))) {
            missingFields.push({ field: "Student Name", trueValue: c.student.user.name });
          }
          if (c.degree && !normalText.includes(normalize(c.degree))) {
            missingFields.push({ field: "Degree", trueValue: c.degree });
          }
          if (c.specialization && !normalText.includes(normalize(c.specialization))) {
            missingFields.push({ field: "Branch", trueValue: c.specialization });
          }
          if (c.cgpa && !normalText.includes(normalize(c.cgpa))) {
            missingFields.push({ field: "CGPA", trueValue: String(c.cgpa) });
          }
          if (c.institution?.name && !normalText.includes(normalize(c.institution.name))) {
            missingFields.push({ field: "College Name", trueValue: c.institution.name });
          }
           
           if (missingFields.length > 0) {
             data.verified = false;
             data.error = "Visual tampering detected";
             data.details = {
                ...data.details,
                tamperedFields: (data.details?.tamperedFields || []).concat(
                  missingFields.map(m => ({
                    field: m.field,
                    original: m.trueValue,
                    current: "Altered visually on PDF"
                  }))
                )
             };
           }
         }
      }

      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to connect to verification server" });
    } finally {
      setLoading(false);
    }
  }

  async function processPDF(file) {
    setLoading(true);
    setResult(null);

    try {
      // Dynamically load PDF.js and jsQR
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const jsQR = (await import("jsqr")).default;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await pdf.getPage(1);

      // 1. Extract PDF metadata (embedded by CredChain download)
      const metadata = await pdf.getMetadata();
      let pdfData = null;
      try {
        const keywords = metadata?.info?.Keywords || "";
        if (keywords) {
          pdfData = JSON.parse(keywords);
        }
      } catch (e) {
        // No valid metadata — old PDF or not from CredChain
      }

      // 2. Extract Text for visual tampering check
      const textContent = await page.getTextContent();
      const extractedText = textContent.items.map((item) => item.str).join(" ");

      // 3. Render to Canvas for QR extraction
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          const payload = JSON.parse(code.data);
          if (payload.credentialId) {
            setQuery(payload.credentialId);
            // Pass metadata, extracted text, and QR hash
            await handleVerify(payload.credentialId, extractedText, payload.hash || null, pdfData);
          } else {
            setResult({ error: "Invalid QR code payload in PDF" });
          }
        } catch (e) {
          setResult({ error: "Could not parse QR code data in PDF" });
        }
      } else {
        setResult({ error: "No verifiable QR code found in this PDF" });
      }
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to process PDF file. Ensure it is a valid credential document." });
    } finally {
      setLoading(false);
    }
  }

  function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      processPDF(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      processPDF(file);
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
            Upload a certificate PDF to instantly verify its authenticity. No login required.
          </p>
        </div>



        {/* File Upload Dropzone */}
        <div
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px 24px",
            textAlign: "center",
            background: "var(--warm-white)",
            cursor: "pointer",
            marginBottom: 40,
            transition: "all 0.2s",
          }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--indigo)"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById("pdf-upload").click()}
        >
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <FileCheck size={36} color="var(--indigo)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Upload Certificate PDF
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Drag and drop your PDF certificate here to instantly verify its authenticity
          </p>
        </div>

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

                {/* Hash details removed as requested */}
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
