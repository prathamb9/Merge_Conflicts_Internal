/**
 * CredChain - Email Service
 * Sends credential notification emails using Nodemailer (Gmail).
 */

import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports (like 587)
  family: 4, // Force IPv4 to prevent ENETUNREACH on IPv6 networks
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a credential issued notification email to the student.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.studentName - Student's full name
 * @param {string} params.credentialNumber - Unique credential number
 * @param {string} params.degree - Degree title
 * @param {string} params.specialization - Specialization (optional)
 * @param {number} params.cgpa - CGPA value
 * @param {string} params.institutionName - Name of the issuing institution
 * @param {string} params.credentialHash - SHA-256 hash of the credential
 * @param {string} params.credentialId - ID for building the verify link
 * @param {string} params.issuedAt - ISO timestamp of issuance
 * @param {Buffer} [params.pdfBuffer] - Optional PDF attachment buffer
 * @returns {Promise<Object>} Nodemailer send response
 */
export async function sendCredentialEmail({
  to,
  studentName,
  credentialNumber,
  degree,
  specialization,
  cgpa,
  institutionName,
  credentialHash,
  credentialId,
  issuedAt,
  pdfBuffer,
}) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?id=${credentialId}`;
  const dateStr = new Date(issuedAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f5f0eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center; margin-bottom:32px;">
      <h1 style="font-size:28px; color:#243b53; margin:0; letter-spacing:-0.5px;">🎓 CredChain</h1>
      <p style="color:#829ab1; font-size:13px; margin-top:4px;">Tamper-Proof Academic Credentials</p>
    </div>

    <!-- Main Card -->
    <div style="background:#ffffff; border-radius:16px; padding:40px 32px; box-shadow: 0 2px 12px rgba(36,59,83,0.08);">
      
      <div style="text-align:center; margin-bottom:28px;">
        <div style="width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg, #6b8f71, #8fb996); margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
          <span style="font-size:28px;">✅</span>
        </div>
        <h2 style="font-size:22px; color:#243b53; margin:0 0 8px;">Credential Issued Successfully</h2>
        <p style="color:#829ab1; font-size:14px; margin:0;">Your academic credential has been cryptographically secured</p>
      </div>

      <hr style="border:none; border-top:1px solid #e8e0d8; margin:24px 0;">

      <!-- Credential Details -->
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; width:140px;">Student</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Credential No.</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${credentialNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Degree</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${degree}</td>
        </tr>
        ${specialization ? `
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Specialization</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${specialization}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">CGPA</td>
          <td style="padding:10px 0; color:#243b53; font-size:20px; font-weight:800;">${cgpa}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Institution</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${institutionName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:#829ab1; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Issued On</td>
          <td style="padding:10px 0; color:#243b53; font-size:14px; font-weight:600;">${dateStr}</td>
        </tr>
      </table>

      <hr style="border:none; border-top:1px solid #e8e0d8; margin:24px 0;">

      ${pdfBuffer ? `
      <!-- PDF Attached Notice -->
      <div style="background:#f0f7f1; border-radius:10px; padding:16px 20px; margin-bottom:20px; border:1px solid #c6e0ca; text-align:center;">
        <p style="color:#3d6b44; font-size:14px; font-weight:600; margin:0 0 4px;">📎 Certificate PDF Attached</p>
        <p style="color:#6b8f71; font-size:12px; margin:0;">Your credential certificate is attached to this email as a PDF file.</p>
      </div>
      ` : ""}

      <!-- Verify Button -->
      <div style="text-align:center;">
        <a href="${verifyUrl}" style="display:inline-block; background:linear-gradient(135deg, #243b53, #334e68); color:#fff; padding:14px 32px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; letter-spacing:0.3px;">
          🔍 Verify This Credential
        </a>
        <p style="color:#829ab1; font-size:12px; margin-top:12px;">
          Share this link with employers or other institutions to verify authenticity
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; margin-top:32px;">
      <p style="color:#9fb3c8; font-size:11px; margin:0;">
        This credential is cryptographically signed and recorded on the CredChain hash-chain ledger.
      </p>
      <p style="color:#9fb3c8; font-size:11px; margin:4px 0 0;">
        Any tampering will be automatically detected during verification.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"CredChain" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `🎓 Your Academic Credential Has Been Issued — ${credentialNumber}`,
    html: html,
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `${credentialNumber}-Certificate.pdf`,
        content: pdfBuffer,
      },
    ];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Credential email sent to ${to} (MessageId: ${info.messageId})${pdfBuffer ? " [with PDF]" : ""}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Failed to send credential email via Nodemailer:", err);
    return { success: false, error: err.message };
  }
}
