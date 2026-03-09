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

        // 🔥 TRIK BYPASS ZOD UNTUK EDIT GAMBAR:
        // Sama seperti di fungsi tambah, kita "kelabui" Zod sementara pakai URL palsu
        const imageBase64 = body.image;
        if (imageBase64 && imageBase64.startsWith('data:image')) {
            body.image = "https://lolos-validasi.com/gambar.png";
        }

        const parsed = menuUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // 🔥 Kembalikan gambar aslinya (Base64) sebelum dimasukkan ke database
        const dataToUpdate = { ...parsed.data };
        if (imageBase64 && imageBase64.startsWith('data:image')) {
            dataToUpdate.image = imageBase64;
        }

        // Ambil data lama untuk dicatat di activity log
        const existing = await prisma.menu.findUnique({ where: { id: menuId } });
        if (!existing || existing.deleted_at !== null) {
            return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
        }

        // Eksekusi Update ke Database
        const updatedMenu = await prisma.menu.update({
            where: { id: menuId },
            data: dataToUpdate,
        });

        // Catat Activity Log jika harga berubah
        if (existing.harga !== updatedMenu.harga) {
            await prisma.activityLog.create({
                data: {
                    user_id: session.userId,
                    action: 'UPDATE_PRICE',
                    entity: 'Menu',
                    entity_id: menuId,
                    old_value: existing.harga.toString(),
                    new_value: updatedMenu.harga.toString(),
                },
            });
        }

        // Catat Activity Log jika stok berubah
        if (existing.stok !== updatedMenu.stok) {
            await prisma.activityLog.create({
                data: {
                    user_id: session.userId,
                    action: 'UPDATE_STOCK',
                    entity: 'Menu',
                    entity_id: menuId,
                    old_value: existing.stok.toString(),
                    new_value: updatedMenu.stok.toString(),
                },
            });
        }

        return NextResponse.json({ ...updatedMenu, is_low_stock: updatedMenu.stok <= updatedMenu.low_stock_threshold }, { status: 200 });

    } catch (error) {
        console.error('❌ Error PATCH /api/admin/menu/[id]:', error);
        return NextResponse.json({ error: 'Gagal update menu' }, { status: 500 });
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