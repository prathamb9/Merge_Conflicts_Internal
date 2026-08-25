import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { prisma } from "@/backend/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Basic verification that the credential exists
    const credential = await prisma.credential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    // Launch headless Chromium browser
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Determine the base URL dynamically based on where the app is running
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Navigate to our dedicated print view page
    const printUrl = `${baseUrl}/credentials/${id}/print`;
    await page.goto(printUrl, { waitUntil: "networkidle" });

    // Wait an extra moment for QR code rendering (since it uses canvas)
    await page.waitForTimeout(500);

    // Generate PDF via native Chrome engine
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    // Return the PDF to the user
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${id}-certificate.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
