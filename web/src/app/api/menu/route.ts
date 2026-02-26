import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function GET() {
  try {
    // 1. Ambil semua menu beserta data transaksinya (hanya ambil 'jumlah'-nya saja agar ringan)
    const menus = await prisma.menu.findMany({
      include: {
        TransaksiItem: {
          select: {
            jumlah: true
          }
        }
      }
    });

    if (menus.length === 0) {
      return NextResponse.json(menus, { status: 200 });
    }

    // 2. Hitung total terjual untuk setiap menu
    const menusWithSales = menus.map((menu) => {
      // Jumlahkan semua 'jumlah' dari TransaksiItem yang terkait dengan menu ini
      const totalTerjual = menu.TransaksiItem.reduce((sum, item) => sum + item.jumlah, 0);
      return { ...menu, totalTerjual };
    });

    // 3. Cari angka penjualan tertinggi (misal: menu A laku 50, menu B laku 100. Berarti tertingginya 100)
    const penjualanTertinggi = Math.max(...menusWithSales.map((m) => m.totalTerjual));

    // 4. Tambahkan flag isBestSeller dan rapikan data sebelum dikirim ke Frontend
    const finalData = menusWithSales.map((menu) => {
      // Kita hapus array TransaksiItem agar respon JSON tidak berat
      const { TransaksiItem, ...menuData } = menu; 
      
      return {
        ...menuData,
        // Menu ini Best Seller JIKA totalTerjual-nya sama dengan rekor tertinggi (dan minimal sudah laku 1)
        isBestSeller: menu.totalTerjual === penjualanTertinggi && menu.totalTerjual > 0
      };
    });

    return NextResponse.json(finalData, { status: 200 });
  } catch (error) {
    console.error("Gagal mengambil menu:", error);
    return NextResponse.json({ error: "Gagal mengambil menu" }, { status: 500 });
  }
}