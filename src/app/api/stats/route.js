/**
 * API: Stats
 * GET /api/stats - Dashboard statistics
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

    const [
      totalCredentials,
      activeCredentials,
      revokedCredentials,
      totalStudents,
      totalBlocks,
      recentCredentials,
      departmentStats,
    ] = await Promise.all([
      prisma.credential.count({ where }),
      prisma.credential.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.credential.count({ where: { ...where, status: "REVOKED" } }),
      prisma.student.count({
        where: session.user.role === "INSTITUTION"
          ? { institutionId: session.user.institutionId }
          : {},
      }),
      prisma.ledgerBlock.count(),
      prisma.credential.findMany({
        where,
        take: 5,
        orderBy: { issuedAt: "desc" },
        include: {
          student: { include: { user: { select: { name: true } } } },
          credentialHash: { select: { credentialHash: true } },
        },
      }),
      prisma.credential.groupBy({
        by: ["degree"],
        where,
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      totalCredentials,
      activeCredentials,
      revokedCredentials,
      totalStudents,
      totalBlocks,
      ledgerIntegrity: 100, // Will be calculated on demand
      recentCredentials,
      departmentStats: departmentStats.map((d) => ({
        name: d.degree,
        count: d._count.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
