import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// ✅ POST - Buat transaksi baru dengan atomic stock deduction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_pelanggan, nomor_meja, items, kasir_id, kasir_nama, metode_pembayaran } = body;

    if (!nama_pelanggan || !nomor_meja || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // ✅ ATOMIC TRANSACTION — Semua operasi berhasil atau semua dibatalkan
    const newTransaksi = await prisma.$transaction(async (tx) => {
      // 1. Ambil semua menu yang diorder sekaligus untuk validasi stok
      const menuIds = items.map((item: any) => Number(item.menu_id));
      const menus = await tx.menu.findMany({
        where: { id: { in: menuIds }, deleted_at: null, tersedia: true },
      });

      // 2. Validasi stok mencukupi untuk setiap item
      let totalHarga = 0;
      for (const item of items) {
        const menu = menus.find((m) => m.id === Number(item.menu_id));
        if (!menu) {
          throw new Error(`Menu dengan ID ${item.menu_id} tidak tersedia`);
        }
        if (menu.stok < Number(item.jumlah)) {
          throw new Error(`Stok "${menu.nama}" tidak mencukupi (tersisa: ${menu.stok})`);
        }
        totalHarga += menu.harga * Number(item.jumlah);
      }

      // 3. Kurangi stok secara atomic per menu
      for (const item of items) {
        const menu = menus.find((m) => m.id === Number(item.menu_id))!;
        const sisaStok = menu.stok - Number(item.jumlah);

        await tx.menu.update({
          where: { id: Number(item.menu_id) },
          data: {
            stok: { decrement: Number(item.jumlah) },
            // Jika stok habis → otomatis non-aktifkan
            ...(sisaStok <= 0 ? { tersedia: false } : {}),
          },
        });
      }

      // 4. Buat transaksi dengan harga yang dihitung server-side (tamper-proof)
      const transaksi = await tx.transaksi.create({
        data: {
          nama_pelanggan,
          nomor_meja: String(nomor_meja),
          status: 'PENDING',
          total_harga: totalHarga,
          kasir_id: kasir_id ? Number(kasir_id) : null,
          kasir_nama: kasir_nama || null,
          metode_pembayaran: metode_pembayaran || null,
          items: {
            create: items.map((item: any) => {
              const menu = menus.find((m) => m.id === Number(item.menu_id))!;
              return {
                menu_id: Number(item.menu_id),
                jumlah: Number(item.jumlah),
                harga_satuan: menu.harga,
                catatan: item.catatan || null,
                // ✅ FIX BUG: Mencegah menu non-sate otomatis jadi level 0 (Pisah Sambal)
                level_pedas: item.level_pedas !== undefined && item.level_pedas !== null ? Number(item.level_pedas) : null,
              };
            }),
          },
        },
        include: {
          // ✅ FIX VERCEL 4.5MB LIMIT: Jangan ambil image base64, cukup data teks yang dibutuhkan kasir
          items: { 
            include: { 
              menu: {
                select: { id: true, nama: true, harga: true }
              } 
            } 
          },
        },
      });

      return transaksi;
    });

    return NextResponse.json(newTransaksi, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const isStock = msg.includes('Stok');
    console.error('❌ Error POST transaksi:', error);
    return NextResponse.json(
      { error: isStock ? msg : 'Gagal membuat transaksi', details: msg },
      { status: isStock ? 409 : 500 }
    );
  }
}