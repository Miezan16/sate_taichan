import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ GET - Ambil semua transaksi
export async function GET() {
  try {
    const transaksi = await prisma.transaksi.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        items: {
          include: { menu: { select: { id: true, nama: true, harga: true } } }
        }
      }
    });
    return NextResponse.json(transaksi, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// ✅ POST - Buat transaksi (SUPER FAST BATCH TRANSACTION - ANTI TIMEOUT)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_pelanggan, nomor_meja, items, kasir_id, kasir_nama, metode_pembayaran } = body;

    if (!nama_pelanggan || !nomor_meja || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Ambil data menu biasa (TIDAK di dalam transaksi agar lebih cepat)
    const menuIds = items.map((item: any) => Number(item.menu_id));
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds }, deleted_at: null, tersedia: true },
      select: { id: true, nama: true, harga: true, stok: true } // Bebas gambar base64
    });

    // 2. Validasi stok & hitung harga di Node.js (Kecepatan cahaya)
    let totalHarga = 0;
    for (const item of items) {
      const menu = menus.find((m) => m.id === Number(item.menu_id));
      if (!menu) throw new Error(`Menu ID ${item.menu_id} tidak tersedia`);
      if (menu.stok < Number(item.jumlah)) throw new Error(`Stok "${menu.nama}" tidak mencukupi (sisa: ${menu.stok})`);
      totalHarga += menu.harga * Number(item.jumlah);
    }

    // 3. Siapkan BATCH operasi database (Bungkus ke dalam array)
    const prismaOperations = [];

    // - Masukkan antrean update stok (puluhan menu sekaligus)
    for (const item of items) {
      const menu = menus.find((m) => m.id === Number(item.menu_id))!;
      const sisaStok = menu.stok - Number(item.jumlah);
      
      prismaOperations.push(
        prisma.menu.update({
          where: { id: Number(item.menu_id) },
          data: {
            stok: { decrement: Number(item.jumlah) },
            ...(sisaStok <= 0 ? { tersedia: false } : {}),
          },
        })
      );
    }

    // - Masukkan antrean pembuatan transaksi di akhir array
    prismaOperations.push(
      prisma.transaksi.create({
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
                level_pedas: item.level_pedas !== undefined && item.level_pedas !== null ? Number(item.level_pedas) : null,
              };
            }),
          },
        },
        include: {
          items: { include: { menu: { select: { id: true, nama: true, harga: true } } } },
        },
      })
    );

    // 4. EKSEKUSI SEMUA SEKALIGUS KE DATABASE (1 Kali Jalan = Tidak Akan Timeout!)
    const results = await prisma.$transaction(prismaOperations);
    
    // Hasil yang kita kirim ke Frontend adalah elemen terakhir (transaksi.create)
    const newTransaksi = results[results.length - 1];

    return NextResponse.json(newTransaksi, { status: 201 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error POST:', msg);
    return NextResponse.json(
      { error: msg.includes('Stok') ? msg : 'Gagal membuat transaksi', details: msg },
      { status: msg.includes('Stok') ? 409 : 500 }
    );
  }
}