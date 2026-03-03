import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cabang - Ambil data cabang pertama (untuk info struk)
export async function GET() {
    try {
        const cabang = await prisma.cabang.findFirst();
        if (!cabang) {
            return NextResponse.json({ error: "Data cabang tidak ditemukan" }, { status: 404 });
        }
        return NextResponse.json(cabang, { status: 200 });
    } catch (error) {
        console.error("❌ Error GET cabang:", error);
        return NextResponse.json({ error: "Gagal mengambil data cabang" }, { status: 500 });
    }
}
