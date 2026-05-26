import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Pre-hash passwords
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Create or Update Super Admin
    const superadmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: { password: defaultPassword },
      create: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: defaultPassword,
        role: Role.SUPERADMIN
      }
    });

    // 2. Create or Update Admin (Project Owner)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { password: defaultPassword },
      create: {
        name: 'Admin Boss',
        email: 'admin@example.com',
        password: defaultPassword,
        role: Role.ADMIN
      }
    });

    // 3. Create or Update Accounting User
    const accounting = await prisma.user.upsert({
      where: { email: 'accounting@example.com' },
      update: { password: defaultPassword },
      create: {
        name: 'Finance Manager',
        email: 'accounting@example.com',
        password: defaultPassword,
        role: Role.ACCOUNTING,
        costPerHour: 30.0
      }
    });

    // 4. Create or Update Staff User
    const staff = await prisma.user.upsert({
      where: { email: 'staff@example.com' },
      update: { password: defaultPassword },
      create: {
        name: 'Alex Staff',
        email: 'staff@example.com',
        password: defaultPassword,
        role: Role.STAFF,
        costPerHour: 25.0
      }
    });

    // 4. Create Project if it doesn't exist
    let project = await prisma.project.findFirst({ where: { name: 'Project Alpha (AI Implementation)' } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Project Alpha (AI Implementation)',
          description: 'Implementing the new Next.js dashboard.',
          ownerId: admin.id
        }
      });
    }

    // 5. Assign Staff to Project if not already assigned
    const assignment = await prisma.projectUser.findUnique({
      where: { userId_projectId: { userId: staff.id, projectId: project.id } }
    });
    if (!assignment) {
      await prisma.projectUser.create({
        data: {
          userId: staff.id,
          projectId: project.id,
          role: 'STAFF'
        }
      });
    }

    return NextResponse.json({
      message: 'Successfully seeded the database!',
      credentials: {
        superadmin: 'superadmin@example.com / password123',
        admin: 'admin@example.com / password123',
        accounting: 'accounting@example.com / password123',
        staff: 'staff@example.com / password123',
      },
      superadminId: superadmin.id,
      adminId: admin.id,
      accountingId: accounting.id,
      staffId: staff.id,
      projectId: project.id
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
