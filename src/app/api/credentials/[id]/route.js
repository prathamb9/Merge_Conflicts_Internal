/**
 * API: Single Credential
 * GET /api/credentials/[id] - Get credential details
 * PATCH /api/credentials/[id] - Revoke credential
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth";
import { prisma } from "@/backend/prisma";
import { revokeCredential, reissueCredential, editCredential } from "@/backend/credential-engine";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const credential = await prisma.credential.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        institution: { select: { id: true, name: true, code: true, logo: true, address: true } },
        credentialHash: true,
        ledgerBlocks: {
          orderBy: { blockIndex: "asc" },
          include: {
            issuer: { select: { name: true } },
          },
        },
        revisions: {
          orderBy: { version: "desc" },
          include: {
            editedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    return NextResponse.json({ credential });
  } catch (error) {
    console.error("Error fetching credential:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "INSTITUTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (action === "REVOKE") {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for revocation" }, { status: 400 });
      }

      const result = await revokeCredential(id, reason, session.user.id);
      return NextResponse.json(result);
    }

    if (action === "REISSUE") {
      const result = await reissueCredential(id, session.user.id);
      return NextResponse.json(result);
    }

    if (action === "EDIT") {
      if (!body.updates || !body.reason) {
        return NextResponse.json({ error: "Updates and reason are required" }, { status: 400 });
      }
      const result = await editCredential({
        credentialId: id,
        updates: body.updates,
        reason: body.reason,
        editorId: session.user.id,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating credential:", error);
    return NextResponse.json({ error: "Failed to update credential" }, { status: 500 });
  }
}
