// src/app/api/admin/menu/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';

type Params = { params: Promise<{ id: string }> };

// ✅ PATCH — Update menu (Bypass Zod / Jalur Langsung)
export async function PATCH(request: NextRequest, context: Params) {
  const authResult = await requireAdmin(request);
  if (isErrorResponse(authResult)) return authResult;
  const { id } = await context.params;
  const menuId = parseInt(id);
  if (isNaN(menuId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  try {
    const body = await request.json();

    // 1. Amankan tipe data angka (String dari frontend dipaksa jadi Number)
    if (body.harga !== undefined && body.harga !== null) body.harga = Number(body.harga);
    if (body.stok !== undefined && body.stok !== null) body.stok = Number(body.stok);
    if (body.low_stock_threshold !== undefined && body.low_stock_threshold !== null) {
      body.low_stock_threshold = Number(body.low_stock_threshold);
    }

    // 2. Buang properti yang tidak boleh di-update oleh Prisma
    const dataToUpdate = { ...body };
    if ('id' in dataToUpdate) delete dataToUpdate.id;
    if ('createdAt' in dataToUpdate) delete dataToUpdate.createdAt;
    if ('updatedAt' in dataToUpdate) delete dataToUpdate.updatedAt;
    if ('is_low_stock' in dataToUpdate) delete dataToUpdate.is_low_stock;

    // 3. Langsung eksekusi ke Database tanpa lewat Zod
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedMenu, { status: 200 });

  } catch (error) {
    console.error('❌ Error PATCH /api/admin/menu/[id]:', error);
    
    // Kirim pesan error database ke frontend supaya kita tahu kalau gagal
    return NextResponse.json({ 
      error: 'Gagal update menu ke database', 
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// ✅ DELETE — HARD DELETE (Hapus permanen dari database)
export async function DELETE(request: NextRequest, context: Params) {
  const authResult = await requireAdmin(request);
  if (isErrorResponse(authResult)) return authResult;
  const { id } = await context.params;
  const menuId = parseInt(id);
  if (isNaN(menuId)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

  try {
    // HARD DELETE - Benar-benar hapus dari database
    await prisma.menu.delete({
      where: { id: menuId },
    });

    return NextResponse.json({ message: `Menu berhasil dihapus permanen dari database` }, { status: 200 });
  } catch (error) {
    console.error('❌ Error DELETE:', error);
    return NextResponse.json({ error: 'Gagal menghapus menu dari database' }, { status: 500 });
  }
}