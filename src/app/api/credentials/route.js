/**
 * API: Credentials
 * GET /api/credentials - List credentials for the institution
 * POST /api/credentials - Issue a new credential
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth";
import { prisma } from "@/backend/prisma";
import { issueCredential } from "@/backend/credential-engine";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where = {};

    if (session.user.role === "INSTITUTION") {
      where.institutionId = session.user.institutionId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { credentialNumber: { contains: search } },
        { degree: { contains: search } },
        { student: { user: { name: { contains: search } } } },
        { student: { studentId: { contains: search } } },
      ];
    }

    const credentials = await prisma.credential.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        institution: { select: { name: true, code: true } },
        credentialHash: { select: { credentialHash: true } },
        ledgerBlocks: {
          select: { blockIndex: true, action: true, currentHash: true, timestamp: true },
          orderBy: { blockIndex: "asc" },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "INSTITUTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, degree, specialization, cgpa } = body;

    if (!studentId || !degree || cgpa === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, degree, cgpa" },
        { status: 400 }
      );
    }

    const result = await issueCredential({
      studentId,
      institutionId: session.user.institutionId,
      issuerId: session.user.id,
      degree,
      specialization,
      cgpa,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error issuing credential:", error);
    return NextResponse.json({ error: "Failed to issue credential" }, { status: 500 });
  }
}
