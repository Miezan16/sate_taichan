// src/app/api/admin/menu/[id]/route.ts
// PATCH  — Update menu (Admin only, Zod, Activity Log on price/stock change)
// DELETE — Soft delete menu (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';
import { menuUpdateSchema } from '@/lib/zod/menu';

type Params = { params: Promise<{ id: string }> };

// ✅ PATCH — Update menu
export async function PATCH(request: NextRequest, context: Params) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { id } = await context.params;
    const menuId = parseInt(id);
    if (isNaN(menuId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const body = await request.json();
        const parsed = menuUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Ambil data lama untuk activity log
        const existing = await prisma.menu.findUnique({ where: { id: menuId } });
        if (!existing || existing.deleted_at !== null) {
            return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
        }

        const data = parsed.data;

        // Jika stok update → cek apakah perlu set tersedia: false
        if (data.stok !== undefined && data.stok <= 0) {
            data.tersedia = false;
        }

        const updated = await prisma.menu.update({
            where: { id: menuId },
            data,
        });

        // Log jika harga atau stok berubah
        const logsToCreate: Array<{ action: string; old_value: string; new_value: string }> = [];
        if (data.harga !== undefined && data.harga !== existing.harga) {
            logsToCreate.push({
                action: 'UPDATE_PRICE',
                old_value: JSON.stringify({ harga: existing.harga }),
                new_value: JSON.stringify({ harga: data.harga }),
            });
        }
        if (data.stok !== undefined && data.stok !== existing.stok) {
            logsToCreate.push({
                action: 'UPDATE_STOCK',
                old_value: JSON.stringify({ stok: existing.stok }),
                new_value: JSON.stringify({ stok: data.stok }),
            });
        }

        if (logsToCreate.length > 0) {
            await prisma.activityLog.createMany({
                data: logsToCreate.map((log) => ({
                    user_id: session.userId,
                    entity: 'Menu',
                    entity_id: menuId,
                    ...log,
                })),
            });
        }

        return NextResponse.json(
            { ...updated, is_low_stock: updated.stok <= updated.low_stock_threshold },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Error PATCH /api/admin/menu/[id]:', error);
        return NextResponse.json({ error: 'Gagal memperbarui menu' }, { status: 500 });
    }
}

// ✅ DELETE — Soft delete (set deleted_at = now())
export async function DELETE(request: NextRequest, context: Params) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { id } = await context.params;
    const menuId = parseInt(id);
    if (isNaN(menuId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    try {
        const existing = await prisma.menu.findUnique({ where: { id: menuId } });
        if (!existing || existing.deleted_at !== null) {
            return NextResponse.json({ error: 'Menu tidak ditemukan atau sudah dihapus' }, { status: 404 });
        }

        await prisma.menu.update({
            where: { id: menuId },
            data: { deleted_at: new Date(), tersedia: false },
        });

        await prisma.activityLog.create({
            data: {
                user_id: session.userId,
                action: 'DELETE_MENU',
                entity: 'Menu',
                entity_id: menuId,
                old_value: JSON.stringify({ nama: existing.nama }),
            },
        });

        return NextResponse.json({ message: `Menu "${existing.nama}" berhasil dihapus (soft delete)` }, { status: 200 });
    } catch (error) {
        console.error('❌ Error DELETE /api/admin/menu/[id]:', error);
        return NextResponse.json({ error: 'Gagal menghapus menu' }, { status: 500 });
    }
}
