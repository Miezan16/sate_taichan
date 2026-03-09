// File: app/api/upload/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Buat nama file unik agar tidak bentrok
        const filename = Date.now() + '-' + file.name.replace(/\s/g, '_');
        
        // Cek dan buat folder public/uploads jika belum ada
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Simpan file fisik secara otomatis ke folder public/uploads
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        
        // Kembalikan URL lokal file tersebut ke frontend
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Gagal menyimpan file" }, { status: 500 });
    }
}