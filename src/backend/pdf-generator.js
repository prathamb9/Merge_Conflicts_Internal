/**
 * CredChain - Server-side PDF Generator
 * Generates credential certificate PDFs using Playwright (headless Chromium).
 */

import { chromium } from "playwright";
import { prisma } from "./prisma";

/**
 * Generate a PDF certificate for a credential.
 * @param {string} credentialId - The credential record ID
 * @param {string} [baseUrl] - Base URL of the app (defaults to NEXTAUTH_URL)
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
export async function generateCredentialPDF(credentialId, baseUrl) {
  const appUrl = baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Verify credential exists
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    // Navigate to the print view
    const printUrl = `${appUrl}/credentials/${credentialId}/print`;
    await page.goto(printUrl, { waitUntil: "networkidle" });

    // Wait for QR code canvas rendering
    await page.waitForTimeout(500);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
