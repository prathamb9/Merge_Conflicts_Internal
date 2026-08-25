/**
 * API: Demo Tamper
 * POST /api/demo/tamper - Simulate tampering with credential data
 */

import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { credentialId, field, newValue } = body;

    if (!credentialId || !field || newValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: credentialId, field, newValue" },
        { status: 400 }
      );
    }

    // Get original values before tampering
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: {
        student: { include: { user: true } },
        credentialHash: true,
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const originalValue = credential[field];

    // Perform the "tamper" - directly modify DB
    const updateData = {};
    if (field === "cgpa") {
      updateData[field] = parseFloat(newValue);
    } else {
      updateData[field] = newValue;
    }

    await prisma.credential.update({
      where: { id: credentialId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      tampered: {
        credentialId,
        field,
        originalValue,
        newValue: updateData[field],
        storedHash: credential.credentialHash?.credentialHash,
        message: `Database record tampered! Field "${field}" changed from "${originalValue}" to "${newValue}". The stored hash will no longer match.`,
      },
    });
  } catch (error) {
    console.error("Tamper error:", error);
    return NextResponse.json({ error: "Tamper simulation failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/demo/tamper - Restore tampered credential
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { credentialId, field, originalValue } = body;

    if (!credentialId || !field || originalValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (field === "cgpa") {
      updateData[field] = parseFloat(originalValue);
    } else {
      updateData[field] = originalValue;
    }

    await prisma.credential.update({
      where: { id: credentialId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Credential restored. Field "${field}" set back to "${originalValue}".`,
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
