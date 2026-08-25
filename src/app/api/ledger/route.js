/**
 * API: Ledger
 * GET /api/ledger - Get all ledger blocks
 */

import { NextResponse } from "next/server";
import { getAllBlocks } from "@/backend/ledger";

export async function GET() {
  try {
    const blocks = await getAllBlocks();
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
