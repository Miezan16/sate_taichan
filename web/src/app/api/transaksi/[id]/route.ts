import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  // 1. Sesuaikan tipe params menjadi Promise
  context: { params: Promise<{ id: string }> } 
) {
  try {
    const body = await request.json();
    const { status, kasir_nama, metode_pembayaran } = body;

    // 2. ✅ PERBAIKAN UTAMA: Await params sebelum mengambil 'id'
    const { id } = await context.params;

    // Validasi ID
    const transaksiId = parseInt(id);
    if (isNaN(transaksiId)) {
      return NextResponse.json(
        { error: "ID Transaksi tidak valid" },
        { status: 400 }
      );
    }

    // Siapkan data yang mau diupdate
    const updateData: any = { status };
    
    // Jika kasir dan metode pembayaran dikirim (saat checkout), masukkan ke data
    if (kasir_nama) updateData.kasir_nama = kasir_nama;
    if (metode_pembayaran) updateData.metode_pembayaran = metode_pembayaran;

    // 3. Update database menggunakan Prisma
    const updatedTransaksi = await prisma.transaksi.update({
      where: { id: transaksiId },
      data: updateData,
    });

    return NextResponse.json(updatedTransaksi, { status: 200 });

  } catch (error) {
    console.error("❌ Error PATCH transaksi:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan" },
      { status: 500 }
    );
  }
}