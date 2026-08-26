/**
 * API: Students
 * GET /api/students - List students for the institution
 * POST /api/students - Register a new student for the institution
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth";
import { prisma } from "@/backend/prisma";
import bcrypt from "bcryptjs";

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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "INSTITUTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, department, studentId, registrationNumber } = body;

    if (!name || !email || !department) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, department" },
        { status: 400 }
      );
    }

    // Check if email already in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Get institution to build IDs
    const institution = await prisma.institution.findUnique({
      where: { id: session.user.institutionId },
    });
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    // Auto-generate studentId and registrationNumber if not provided
    const year = new Date().getFullYear();
    const deptAbbr = department
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);

    const count = await prisma.student.count({
      where: { institutionId: institution.id },
    });
    const seq = (count + 1).toString().padStart(3, "0");

    const finalStudentId = studentId?.trim() || `${institution.code}-${deptAbbr}-${year}-${seq}`;
    const finalRegNum = registrationNumber?.trim() || `${year}${deptAbbr}${seq}`;

    // Check if studentId is already taken
    if (studentId?.trim()) {
      const takenId = await prisma.student.findUnique({ where: { studentId: studentId.trim() } });
      if (takenId) {
        return NextResponse.json({ error: "Student ID is already in use" }, { status: 409 });
      }
    }

    // Create user + student in a transaction
    const passwordHash = await bcrypt.hash("changeme123", 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "STUDENT",
      },
    });

    const newStudent = await prisma.student.create({
      data: {
        studentId: finalStudentId,
        registrationNumber: finalRegNum,
        department: department.trim(),
        userId: newUser.id,
        institutionId: institution.id,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_REGISTERED",
        entityType: "Student",
        entityId: newStudent.id,
        performedBy: session.user.id,
        details: `Registered new student ${name} (${finalStudentId}) for ${institution.name}`,
      },
    });

    return NextResponse.json({ student: newStudent }, { status: 201 });
  } catch (error) {
    console.error("Error registering student:", error);
    return NextResponse.json({ error: "Failed to register student" }, { status: 500 });
  }
}
