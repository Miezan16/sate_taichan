// src/app/api/admin/users/[id]/route.ts
// PATCH  — Update user (Admin only, re-hash password jika diisi)
// DELETE — Hapus user (Admin only, cegah self-delete)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';
import { userUpdateSchema } from '@/lib/zod/user';
import bcrypt from 'bcryptjs';

type Params = { params: Promise<{ id: string }> };

// ✅ PATCH — Update user
export async function PATCH(request: NextRequest, context: Params) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const body = await request.json();
        const parsed = userUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } });
        if (!existing) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

        const updateData: Record<string, any> = {};
        if (parsed.data.username !== undefined) updateData.username = parsed.data.username;
        if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
        if ('cabang_id' in parsed.data) updateData.cabang_id = parsed.data.cabang_id ?? null;

        // Hash password baru jika diisi
        if (parsed.data.password) {
            updateData.password_hash = await bcrypt.hash(parsed.data.password, 12);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, role: true, cabang_id: true },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
        }
        console.error('❌ Error PATCH /api/admin/users/[id]:', error);
        return NextResponse.json({ error: 'Gagal memperbarui user' }, { status: 500 });
    }
}

// ✅ DELETE — Hapus user (cegah self-delete)
export async function DELETE(request: NextRequest, context: Params) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { id } = await context.params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    // Cegah admin menghapus dirinya sendiri
    if (userId === session.userId) {
        return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
    }

    try {
        const existing = await prisma.user.findUnique({ where: { id: userId } });
        if (!existing) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ message: `User "${existing.username}" berhasil dihapus` }, { status: 200 });
    } catch (error) {
        console.error('❌ Error DELETE /api/admin/users/[id]:', error);
        return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
    }
}
