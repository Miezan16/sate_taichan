import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Ambil semua menu aktif dari Database
    const menusFromDb = await prisma.menu.findMany({
      where: { deleted_at: null }, // Sesuaikan dengan schema jika ada field 'tersedia'
    });

    // 2. Cari Menu Terlaris secara berurutan (Paling banyak dibeli -> Terendah)
    const topSelling = await prisma.transaksiItem.groupBy({
      by: ["menu_id"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } }, // Diurutkan dari yang paling banyak dibeli
      take: 4, // Ambil Top 4
    });

    // 3. Siapkan String Data untuk AI
    let catalogText = "";
    menusFromDb.forEach((m) => {
      catalogText += `ID-${m.id} : ${m.nama} (Rp ${m.harga})\n`;
    });

    const topMenuText = topSelling
      .map((t, index) => {
        const menu = menusFromDb.find((m) => m.id === t.menu_id);
        return menu ? `${index + 1}. ${menu.nama} (Terjual: ${t._sum.jumlah} porsi) - Gunakan Kode: ID-${menu.id}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, 
        topP: 0.9,
      },
      systemInstruction: `Kamu adalah "Sadjodo AI", asisten virtual eksklusif, cerdas, dan profesional untuk restoran premium "Sate Taichan Sadjodo".

=========================================
ATURAN BAHASA & GAYA KOMUNIKASI 
=========================================
1. BAHASA DEFAULT: Gunakan Bahasa Indonesia yang asik, ramah, elegan dan menggugah selera. Panggil pengguna dengan "Kak".
2. JAWABAN NATURAL: Jawab langsung ke intinya. Hindari kalimat yang terdengar seperti robot atau sistem.

=========================================
KATALOG MENU KAMI
=========================================
${catalogText}

=========================================
MENU TERLARIS (DIURUTKAN DARI TERBANYAK)
=========================================
${topMenuText || "Belum ada data penjualan."}

=========================================
LOGIKA MENJAWAB & FORMAT (SANGAT PENTING)
=========================================
1. JIKA MENAMPILKAN MENU: Ceritakan menu tersebut dengan bahasa yang menarik di dalam teks "jawaban". 
2. ATURAN ID MENU (RAHASIA): Untuk memunculkan gambar menu di layar pengguna, kamu WAJIB memasukkan kode "ID-..." menu tersebut ke dalam array "menus" pada JSON.
3. LARANGAN KERAS: JANGAN PERNAH menuliskan kode "ID-..." atau hal teknis lainnya di dalam teks "jawaban"! Pengguna tidak boleh melihat kode tersebut. Cukup sebutkan nama menunya saja.

HANYA JAWAB DENGAN JSON BERIKUT:
{
  "jawaban": "Teks jawaban natural kamu tanpa menyebutkan ID menu...",
  "menus": ["ID-1", "ID-2"], 
  "catatan": "Tulis log aktivitas singkat"
}
`,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    let cleanJSON = responseText.replace(/```json|```/g, "").trim();
    let parsedData = JSON.parse(cleanJSON);

    // 4. Mapping ID kembali ke Data Menu utuh
    const responseMenus = (parsedData.menus || [])
      .map((aiId: string) => {
        const dbId = parseInt(aiId.replace("ID-", ""));
        const menu = menusFromDb.find((m) => m.id === dbId);
        if (menu) {
          return {
            nama: menu.nama,
            harga: menu.harga.toString(),
            image: menu.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80", 
            deskripsi: menu.deskripsi || "Menu spesial pilihan Sadjodo.",
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      jawaban: parsedData.jawaban,
      menus: responseMenus, 
      catatan: parsedData.catatan || "-",
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { jawaban: "Duh Kak, koneksi Sadjodo AI lagi terganggu sedikit. Mohon coba lagi ya!", menus: [], catatan: "Error" },
      { status: 500 }
    );
  }
}