// src/app/api/admin/menu/route.ts
// GET  — List semua menu aktif + flag is_low_stock
// POST — Buat menu baru (Admin only, Zod validated)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';
import { menuCreateSchema } from '@/lib/zod/menu';

// ✅ GET — Siapapun bisa melihat daftar menu aktif (pelanggan juga)
// Tapi response untuk admin menyertakan flag is_low_stock
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('include_deleted') === 'true';

        const menus = await prisma.menu.findMany({
            where: includeDeleted ? undefined : { deleted_at: null },
            orderBy: { createdAt: 'desc' },
        });

        // Tambahkan flag is_low_stock ke setiap menu
        const result = menus.map((menu) => ({
            ...menu,
            is_low_stock: menu.stok <= menu.low_stock_threshold,
        }));

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('❌ Error GET /api/admin/menu:', error);
        return NextResponse.json({ error: 'Gagal mengambil data menu' }, { status: 500 });
    }
}

// ✅ POST — Buat menu baru (Admin only)
export async function POST(request: NextRequest) {
    // Guard: hanya admin
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    try {
        const body = await request.json();
        const parsed = menuCreateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const menu = await prisma.menu.create({ data: parsed.data });

        // Activity log
        await prisma.activityLog.create({
            data: {
                user_id: session.userId,
                action: 'CREATE_MENU',
                entity: 'Menu',
                entity_id: menu.id,
                new_value: JSON.stringify({ nama: menu.nama, harga: menu.harga, stok: menu.stok }),
            },
        });

        return NextResponse.json({ ...menu, is_low_stock: menu.stok <= menu.low_stock_threshold }, { status: 201 });
    } catch (error) {
        console.error('❌ Error POST /api/admin/menu:', error);
        return NextResponse.json({ error: 'Gagal membuat menu' }, { status: 500 });
    }
}
