import { NextResponse } from "next/server";
import { generateCredentialPDF } from "@/backend/pdf-generator";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Determine the base URL dynamically based on where the app is running
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Generate PDF via native Chrome engine
    const pdfBuffer = await generateCredentialPDF(id, baseUrl);

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
    if (error.message === "Credential not found") {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
