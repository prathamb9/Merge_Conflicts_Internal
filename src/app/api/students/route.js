/**
 * API: Students
 * GET /api/students - List students for the institution
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth";
import { prisma } from "@/backend/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = {};
    if (session.user.role === "INSTITUTION") {
      where.institutionId = session.user.institutionId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        credentials: {
          select: { id: true, status: true, degree: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
