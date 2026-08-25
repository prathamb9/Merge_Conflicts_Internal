/**
 * API: Public Verify
 * POST /api/verify - Public verification by credential number, hash, or ID
 */

import { NextResponse } from "next/server";
import { findCredential, verifyCredential } from "@/backend/credential-engine";

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Please provide a credential number, hash, or ID" },
        { status: 400 }
      );
    }

    const credential = await findCredential(query.trim());

    if (!credential) {
      return NextResponse.json({
        verified: false,
        credential: null,
        checks: {
          exists: false,
          hashMatch: false,
          signatureValid: false,
          ledgerIntact: false,
          notRevoked: false,
        },
        error: "No credential found matching the provided query",
      });
    }

    const result = await verifyCredential(credential.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in public verify:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
