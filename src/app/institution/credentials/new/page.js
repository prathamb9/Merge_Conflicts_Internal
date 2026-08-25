"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  GraduationCap,
  Eye,
  Shield,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Hash,
  FileSignature,
  Link2,
  QrCode,
} from "lucide-react";

const STEPS = [
  { label: "Student", icon: <User size={14} /> },
  { label: "Academic", icon: <GraduationCap size={14} /> },
  { label: "Preview", icon: <Eye size={14} /> },
  { label: "Securing", icon: <Shield size={14} /> },
  { label: "Complete", icon: <CheckCircle2 size={14} /> },
];

const CRYPTO_STEPS = [
  { label: "Serializing credential data...", icon: <Hash size={18} />, detail: "Creating canonical JSON representation" },
  { label: "Computing SHA-256 hash...", icon: <Hash size={18} />, detail: "Generating unique digital fingerprint" },
  { label: "Signing with private key...", icon: <FileSignature size={18} />, detail: "Ed25519 digital signature" },
  { label: "Appending to ledger...", icon: <Link2 size={18} />, detail: "Chaining new block to hash-chain" },
  { label: "Generating QR code...", icon: <QrCode size={18} />, detail: "Creating verification link" },
];

export default function IssueCredentialPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cryptoStep, setCryptoStep] = useState(-1);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    studentId: "",
    degree: "",
    specialization: "",
    cgpa: "",
  });

  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data.students || []));
  }, []);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "studentId") {
      setSelectedStudent(students.find((s) => s.id === value) || null);
    }
  }

  async function handleSubmit() {
    setStep(3);
    setLoading(true);

    // Animate crypto steps
    for (let i = 0; i < CRYPTO_STEPS.length; i++) {
      setCryptoStep(i);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep(4);
      } else {
        alert(data.error || "Failed to issue credential");
        setStep(2);
      }
    } catch (err) {
      alert("Error issuing credential");
      setStep(2);
    }

    setLoading(false);
  }

  function canProceed() {
    if (step === 0) return !!form.studentId;
    if (step === 1) return !!form.degree && !!form.cgpa;
    return true;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 className="font-editorial" style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--indigo-dark)", marginBottom: 8 }}>
        Issue Credential
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 32 }}>
        Create a new cryptographically secured academic credential
      </p>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={i} className="stepper-step">
            <div className={`stepper-dot ${i < step ? "completed" : i === step ? "active" : "pending"}`}>
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className="stepper-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="paper-card" style={{ padding: 32 }}>
        {/* Step 0: Student Selection */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Select Student</h2>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Student
              </label>
              <select
                className="input"
                value={form.studentId}
                onChange={(e) => updateForm("studentId", e.target.value)}
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} — {s.studentId} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div style={{ marginTop: 20, padding: 16, background: "var(--cream)", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontWeight: 600 }}>{selectedStudent.user.name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {selectedStudent.studentId} • {selectedStudent.department} • {selectedStudent.registrationNumber}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Academic Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Academic Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Degree
                </label>
                <select className="input" value={form.degree} onChange={(e) => updateForm("degree", e.target.value)}>
                  <option value="">Select degree...</option>
                  <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                  <option value="B.Tech Electronics & Communication">B.Tech Electronics & Communication</option>
                  <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                  <option value="B.Tech Civil Engineering">B.Tech Civil Engineering</option>
                  <option value="M.Tech Computer Science">M.Tech Computer Science</option>
                  <option value="M.Tech AI & Machine Learning">M.Tech AI & Machine Learning</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD Computer Science">PhD Computer Science</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Specialization (Optional)
                </label>
                <input
                  className="input"
                  placeholder="e.g., Artificial Intelligence"
                  value={form.specialization}
                  onChange={(e) => updateForm("specialization", e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  CGPA
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g., 8.72"
                  value={form.cgpa}
                  onChange={(e) => updateForm("cgpa", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Preview & Confirm</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Student</span>
                <p style={{ fontWeight: 600 }}>{selectedStudent?.user?.name}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Student ID</span>
                <p style={{ fontWeight: 600 }}>{selectedStudent?.studentId}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Department</span>
                <p style={{ fontWeight: 600 }}>{selectedStudent?.department}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Degree</span>
                <p style={{ fontWeight: 600 }}>{form.degree}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Specialization</span>
                <p style={{ fontWeight: 600 }}>{form.specialization || "—"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CGPA</span>
                <p className="font-editorial" style={{ fontWeight: 700, fontSize: "1.3rem" }}>{form.cgpa}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Crypto Animation */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Securing Credential</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 24 }}>
              Applying cryptographic security to the credential...
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CRYPTO_STEPS.map((cs, i) => (
                <div key={i} className={`crypto-step ${i === cryptoStep ? "active" : i < cryptoStep ? "completed" : ""}`}>
                  <div className={`crypto-step-icon ${i === cryptoStep ? "active" : i < cryptoStep ? "completed" : "pending"}`}>
                    {i < cryptoStep ? <CheckCircle2 size={18} /> : cs.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cs.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cs.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && result && (
          <div className="animate-fade-in" style={{ textAlign: "center" }}>
            <div className="animate-stamp" style={{ display: "inline-block", marginBottom: 20 }}>
              <div className="verified-seal">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h2 className="font-editorial" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--sage-dark)", marginBottom: 8 }}>
              Credential Issued!
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
              {result.credential?.credentialNumber}
            </p>

            <div style={{ textAlign: "left", marginBottom: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Credential Hash</span>
                <div className="hash-display">{result.credentialHash}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ledger Block #{result.block?.blockIndex}</span>
                <div className="hash-display">{result.block?.currentHash}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => router.push(`/institution/credentials/${result.credential?.id}`)}
                className="btn btn-primary"
              >
                View Credential <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setForm({ studentId: "", degree: "", specialization: "", cgpa: "" });
                  setSelectedStudent(null);
                  setResult(null);
                  setCryptoStep(-1);
                }}
                className="btn btn-ghost"
              >
                Issue Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 3 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="btn btn-ghost"
            disabled={step === 0}
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="btn btn-primary"
              disabled={!canProceed()}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-sage" disabled={loading}>
              {loading ? <Loader2 size={16} /> : <><Shield size={16} /> Issue & Secure</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
