import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cabang_id = searchParams.get("cabang_id");

    // Filter by Cabang. Kalau cabang_id dipilih di Admin, grafik hanya tarik data cabang tersebut.
    const whereClause: any = {
      status: "COMPLETED", 
    };
    if (cabang_id) {
      whereClause.cabang_id = Number(cabang_id);
    }

    const transactions = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        items: {
          include: { menu: true },
        },
      },
    });

    // Kalkulasi Jam Ramai (WIB / UTC+7)
    const hoursMap: Record<string, number> = {};
    for (let i = 10; i <= 23; i++) {
        hoursMap[`${i.toString().padStart(2, '0')}:00`] = 0;
    }

    transactions.forEach((trx) => {
      const utcDate = new Date(trx.tanggal);
      const wibHour = (utcDate.getUTCHours() + 7) % 24; 
      const hourStr = wibHour.toString().padStart(2, '0') + ":00";
      
      if (hoursMap[hourStr] !== undefined) {
        hoursMap[hourStr] += 1;
      } else {
        hoursMap[hourStr] = 1;
      }
    });

    const peakHours = Object.keys(hoursMap)
      .map((hour) => ({ hour, count: hoursMap[hour] }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Kalkulasi Penjualan Menu
    const menuSales: Record<string, number> = {};
    const allMenus = await prisma.menu.findMany({ where: { deleted_at: null } });
    
    allMenus.forEach((menu) => { menuSales[menu.nama] = 0; });
    
    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const menuName = item.menu.nama;
        if (menuSales[menuName] !== undefined) {
          menuSales[menuName] += item.jumlah;
        } else {
          menuSales[menuName] = item.jumlah;
        }
      });
    });

    const sortedMenus = Object.keys(menuSales)
      .map((name) => ({ name, sold: menuSales[name] }))
      .sort((a, b) => b.sold - a.sold); 

    const bestSellers = sortedMenus;
    const lowDemand = sortedMenus.slice(-5).reverse();

    return NextResponse.json({
      peakHours,
      bestSellers,
      lowDemand,
    });

  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data analitik" }, { status: 500 });
  }
}