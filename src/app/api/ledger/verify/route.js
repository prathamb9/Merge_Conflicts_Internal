/**
 * API: Verify Ledger Integrity
 * POST /api/ledger/verify - Recalculate and verify entire chain
 */

import { NextResponse } from "next/server";
import { verifyChainIntegrity } from "@/backend/ledger";

export async function POST() {
  try {
    const result = await verifyChainIntegrity();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying ledger:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
