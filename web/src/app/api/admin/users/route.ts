// src/app/api/admin/users/route.ts
// GET  — List semua user (Admin only)
// POST — Buat user baru (Admin only, bcrypt password)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';
import { userCreateSchema } from '@/lib/zod/user';
import bcrypt from 'bcryptjs';

// ✅ GET — List semua user tanpa password_hash
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                cabang_id: true,
                cabang: { select: { id: true, nama_cabang: true } },
            },
            orderBy: { id: 'asc' },
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('❌ Error GET /api/admin/users:', error);
        return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 });
    }
}

// ✅ POST — Buat user baru
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    try {
        const body = await request.json();
        const parsed = userCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { username, password, role, cabang_id } = parsed.data;

        // Cek duplikat username
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { username, password_hash, role, cabang_id: cabang_id ?? null },
            select: { id: true, username: true, role: true, cabang_id: true },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('❌ Error POST /api/admin/users:', error);
        return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
    }
}
