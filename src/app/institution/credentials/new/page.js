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
  Mail,
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
  { label: "Sending email notification...", icon: <Mail size={18} />, detail: "Delivering credential to student inbox" },
];

export default function IssueCredentialPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cryptoStep, setCryptoStep] = useState(-1);
  const [result, setResult] = useState(null);

  // New-student mode state
  const [newStudentMode, setNewStudentMode] = useState(false);
  const [registeringStudent, setRegisteringStudent] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    department: "",
    studentId: "",
    registrationNumber: "",
  });

  const [form, setForm] = useState({
    studentId: "",
    degree: "",
    specialization: "",
    cgpa: "",
    notifyEmail: "",
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
      const found = students.find((s) => s.id === value) || null;
      setSelectedStudent(found);
      // Pre-fill the notification email from student's user email
      if (found?.user?.email) {
        setForm((prev) => ({ ...prev, studentId: value, notifyEmail: found.user.email }));
      }
    }
  }

  function updateNewStudentForm(field, value) {
    setNewStudentForm((prev) => ({ ...prev, [field]: value }));
    setRegisterError("");
  }

  async function registerNewStudent() {
    setRegisterError("");
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim() || !newStudentForm.department.trim()) {
      setRegisterError("Name, email, and department are required.");
      return;
    }
    setRegisteringStudent(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error || "Failed to register student.");
        return;
      }
      // Refresh students list
      const updatedRes = await fetch("/api/students");
      const updatedData = await updatedRes.json();
      const updatedList = updatedData.students || [];
      setStudents(updatedList);

      // Auto-select the newly created student
      const created = updatedList.find((s) => s.id === data.student.id);
      if (created) {
        setSelectedStudent(created);
        setForm((prev) => ({ ...prev, studentId: created.id, notifyEmail: created.user?.email || "" }));
      }

      // Reset the new-student form and exit the registration panel
      setNewStudentForm({ name: "", email: "", department: "", studentId: "", registrationNumber: "" });
      setNewStudentMode(false);
    } catch {
      setRegisterError("Network error. Please try again.");
    } finally {
      setRegisteringStudent(false);
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

            {/* Toggle tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-light)" }}>
              <button
                onClick={() => { setNewStudentMode(false); setRegisterError(""); }}
                style={{
                  flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.85rem",
                  background: !newStudentMode ? "var(--indigo)" : "transparent",
                  color: !newStudentMode ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                Existing Student
              </button>
              <button
                onClick={() => { setNewStudentMode(true); setRegisterError(""); setSelectedStudent(null); setForm((p) => ({ ...p, studentId: "", notifyEmail: "" })); }}
                style={{
                  flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.85rem",
                  background: newStudentMode ? "var(--indigo)" : "transparent",
                  color: newStudentMode ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                + New Student
              </button>
            </div>

            {/* Existing student picker */}
            {!newStudentMode && (
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

                {selectedStudent && (
                  <div style={{ marginTop: 20, padding: 16, background: "var(--cream)", borderRadius: "var(--radius-md)" }}>
                    <p style={{ fontWeight: 600 }}>{selectedStudent.user.name}</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {selectedStudent.studentId} • {selectedStudent.department} • {selectedStudent.registrationNumber}
                    </p>
                  </div>
                )}

                {!selectedStudent && (
                  <div style={{ marginTop: 12, padding: 12, background: "var(--cream)", borderRadius: "var(--radius-md)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {"Don't see the student? Switch to "}<strong>+ New Student</strong>{" to register them first."}
                  </div>
                )}
              </div>
            )}

            {/* New student registration form */}
            {newStudentMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Full Name <span style={{ color: "var(--terracotta)" }}>*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g., Riya Kapoor"
                      value={newStudentForm.name}
                      onChange={(e) => updateNewStudentForm("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Email <span style={{ color: "var(--terracotta)" }}>*</span>
                    </label>
                    <input
                      className="input"
                      type="email"
                      placeholder="e.g., riya@iitb.ac.in"
                      value={newStudentForm.email}
                      onChange={(e) => updateNewStudentForm("email", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Department <span style={{ color: "var(--terracotta)" }}>*</span>
                  </label>
                  <select
                    className="input"
                    value={newStudentForm.department}
                    onChange={(e) => updateNewStudentForm("department", e.target.value)}
                  >
                    <option value="">Select department...</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Communication">Electronics &amp; Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Aerospace Engineering">Aerospace Engineering</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Management Studies">Management Studies</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Student ID <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(auto-generated if blank)</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g., IITB-CS-2026-011"
                      value={newStudentForm.studentId}
                      onChange={(e) => updateNewStudentForm("studentId", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Registration No. <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(auto-generated if blank)</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g., 26CS011"
                      value={newStudentForm.registrationNumber}
                      onChange={(e) => updateNewStudentForm("registrationNumber", e.target.value)}
                    />
                  </div>
                </div>

                {registerError && (
                  <p style={{ fontSize: "0.85rem", color: "var(--terracotta)", fontWeight: 500 }}>
                    ⚠ {registerError}
                  </p>
                )}

                <button
                  onClick={registerNewStudent}
                  className="btn btn-primary"
                  disabled={registeringStudent}
                  style={{ alignSelf: "flex-start" }}
                >
                  {registeringStudent ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  {registeringStudent ? " Registering..." : "Register & Select Student"}
                </button>

                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  A temporary password <strong>changeme123</strong> will be set. The student can update it after first login.
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
                  <option value="B.Tech Electronics & Communication">B.Tech Electronics &amp; Communication</option>
                  <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                  <option value="B.Tech Civil Engineering">B.Tech Civil Engineering</option>
                  <option value="M.Tech Computer Science">M.Tech Computer Science</option>
                  <option value="M.Tech AI & Machine Learning">M.Tech AI &amp; Machine Learning</option>
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
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  <Mail size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  Send Credential to Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="e.g., student@gmail.com"
                  value={form.notifyEmail}
                  onChange={(e) => updateForm("notifyEmail", e.target.value)}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                  The student will receive their credential details and a verification link at this email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Preview &amp; Confirm</h2>
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
              {form.notifyEmail && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <Mail size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    Email Notification
                  </span>
                  <p style={{ fontWeight: 600 }}>{form.notifyEmail}</p>
                </div>
              )}
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

            {/* Email status */}
            {result.emailStatus && (
              <div style={{
                marginBottom: 24, padding: 14, borderRadius: "var(--radius-md)",
                background: result.emailStatus.success ? "rgba(107,143,113,0.1)" : "rgba(201,107,75,0.1)",
                border: `1px solid ${result.emailStatus.success ? "var(--sage)" : "var(--terracotta)"}`,
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              }}>
                <Mail size={18} color={result.emailStatus.success ? "var(--sage-dark)" : "var(--terracotta)"} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: result.emailStatus.success ? "var(--sage-dark)" : "var(--terracotta-dark)" }}>
                    {result.emailStatus.success ? "Email sent successfully" : "Email delivery failed"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {result.emailStatus.success
                      ? `Credential details sent to ${form.notifyEmail}`
                      : (result.emailStatus.error || "Please check your Resend API key")}
                  </p>
                </div>
              </div>
            )}

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
                  setForm({ studentId: "", degree: "", specialization: "", cgpa: "", notifyEmail: "" });
                  setSelectedStudent(null);
                  setResult(null);
                  setCryptoStep(-1);
                  setNewStudentMode(false);
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
              {loading ? <Loader2 size={16} /> : <><Shield size={16} /> Issue &amp; Secure</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
