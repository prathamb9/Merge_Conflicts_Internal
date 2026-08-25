/**
 * API: Verify Credential
 * POST /api/credentials/[id]/verify - Public verification endpoint
 */

import { NextResponse } from "next/server";
import { verifyCredential } from "@/backend/credential-engine";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const result = await verifyCredential(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying credential:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await verifyCredential(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying credential:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
