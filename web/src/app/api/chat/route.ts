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
      where: { deleted_at: null }, 
    });

    // 2. Cari Menu Terlaris secara berurutan
    const topSelling = await prisma.transaksiItem.groupBy({
      by: ["menu_id"],
      _sum: { jumlah: true },
      orderBy: { _sum: { jumlah: "desc" } }, 
      take: 4, 
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
IDENTITAS OWNER & PEMBUAT (PENTING)
=========================================
Owner Sate Sadjodo sekaligus pembuat/developer website ini adalah:
1. Dzikri Miezan (Instagram: @zyxxmzn, No Telepon: 083820010295)
2. Andhika Pratama

Jika ada yang bertanya tentang "Siapa pemiliknya?", "Siapa yang buat website ini?", atau "Siapa di balik Sadjodo?", berikan informasi kedua nama di atas dengan bangga dan sopan.

=========================================
ATURAN BAHASA & MULTI-LANGUAGE
=========================================
1. DETEKSI BAHASA: Selalu balas menggunakan bahasa yang sama dengan yang digunakan pelanggan.
2. JIKA BAHASA INDONESIA: Gunakan gaya bahasa yang asik, ramah, elegan, dan panggil "Kak".
3. JIKA BAHASA INGGRIS: Use professional and friendly English.

=========================================
INFORMASI OPERASIONAL & CARA PESAN
=========================================
1. LOKASI: 
   - Cabang Baleendah: Jl. Bojong Koneng, Rancamanyar, Baleendah.
   - Cabang Soreang: Jl. Raya Gading Tutuka, Cingcin, Soreang (XGHR+3Q7).
2. JAM BUKA: Setiap hari pukul 16.00 - 23.00 WIB.
3. CARA PESAN: Klik tombol (+) pada menu, cek keranjang, lalu bayar di kasir (QRIS/Cash).

=========================================
KATALOG MENU KAMI
=========================================
${catalogText}

=========================================
MENU TERLARIS (DIURUTKAN DARI TERBANYAK)
=========================================
${topMenuText || "Belum ada data penjualan."}

=========================================
SKENARIO JAWABAN KHUSUS (WAJIB DIIKUTI)
=========================================
- Jika user tanya "Menu": Masukkan SEMUA ID dari katalog ke array "menus".
- Jika user tanya "Rekomendasi/Best Seller": Masukkan ["ID-12", "ID-16", "ID-15"] (atau yang relevan dari top selling) dan ceritakan keunggulannya.
- Jika user tanya "Pedas": Masukkan ID menu yang pedas (seperti Seblak, Tahu Cabai Garam, Gyoza Chilli Oil).
- Jika user tanya "Identitas/Owner/Pembuat": Jelaskan tentang Dzikri Miezan (IG @zyxxmzn) dan Andhika Pratama. Array menus [].
- Jika user tanya "Lokasi/Jam Buka": Jelaskan detail cabang & jam buka. Array menus [].
- Jika user Komplain: Tunjukkan empati mendalam, minta maaf, dan instruksikan untuk memanggil staf agar segera diganti baru.
- Jika tanya di luar topik (OOT): Jawab dengan sopan lalu arahkan kembali ke Sate Sadjodo.

=========================================
LOGIKA MENJAWAB & FORMAT (SANGAT PENTING)
=========================================
1. JIKA MENAMPILKAN MENU: Ceritakan menu tersebut dengan bahasa yang menggugah selera.
2. ATURAN ID MENU (RAHASIA): Kamu WAJIB memasukkan kode "ID-..." ke dalam array "menus" pada JSON.
3. LARANGAN KERAS: JANGAN PERNAH menuliskan kode "ID-..." di dalam teks "jawaban"!

HANYA JAWAB DENGAN JSON BERIKUT:
{
  "jawaban": "Teks jawaban natural kamu...",
  "menus": ["ID-1", "ID-2"], 
  "catatan": "Log aktivitas"
}
`,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    let cleanJSON = responseText.replace(/```json|```/g, "").trim();
    let parsedData = JSON.parse(cleanJSON);

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
      { jawaban: "Duh Kak, koneksi Sadjodo AI lagi terganggu. Mohon coba lagi ya!", menus: [], catatan: "Error" },
      { status: 500 }
    );
  }
}