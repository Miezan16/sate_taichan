import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { status, metode_pembayaran, uang_bayar, kembalian } = body;

    // ✅ SECURITY: Ambil nama kasir dari session JWT, bukan dari body client
    let kasir_nama: string | undefined;
    if (status === 'COMPLETED') {
      const session = await getSession(request);
      if (!session) {
        return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
      }
      kasir_nama = session.username;
    }

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

    // ✅ PERBAIKAN: Tambahkan field uang_bayar dan kembalian
    if (uang_bayar !== undefined) updateData.uang_bayar = Number(uang_bayar);
    if (kembalian !== undefined) updateData.kembalian = Number(kembalian);

    // Update database menggunakan Prisma
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