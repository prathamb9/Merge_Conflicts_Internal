import "./globals.css";
import AuthProvider from "@/frontend/components/AuthProvider";

export const metadata = {
  title: "CredChain — Tamper-Proof Academic Credential Verification",
  description:
    "Blockchain-based academic credential verification system. Issue, secure, and verify academic credentials with cryptographic integrity.",
  keywords: "blockchain, credentials, verification, academic, university, tamper-proof",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
