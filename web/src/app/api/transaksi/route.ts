import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ GET - Ambil semua transaksi (untuk dashboard kasir)
export async function GET() {
  try {
    const transaksi = await prisma.transaksi.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        items: {
          include: {
            menu: {
              select: {
                id: true,
                nama: true,
                harga: true,
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(transaksi, { status: 200 });
  } catch (error) {
    console.error('❌ Error GET transaksi:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data transaksi', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// ✅ POST - Buat transaksi baru (dari customer checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_pelanggan, nomor_meja, items, total_harga } = body;

    // Validasi input
    if (!nama_pelanggan || !nomor_meja || !items || !total_harga) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // ✅ Perbaikan utama: Tambahkan pembungkus "data"
    const newTransaksi = await prisma.transaksi.create({
      data: {
        nama_pelanggan,
        nomor_meja: String(nomor_meja), // Pastikan string jika di schema String
        status: 'PENDING', 
        total_harga: Number(total_harga),
        items: {
          create: items.map((item: any) => ({
            menu_id: Number(item.menu_id),
            jumlah: Number(item.jumlah),
            harga_satuan: Number(item.harga_satuan),
          }))
        }
      },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    });

    return NextResponse.json(newTransaksi, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error POST transaksi:', error);
    return NextResponse.json(
      { 
        error: 'Gagal membuat transaksi', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}