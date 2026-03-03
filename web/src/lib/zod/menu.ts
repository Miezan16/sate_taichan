// src/lib/zod/menu.ts
// Zod schemas untuk validasi input Menu API
import { z } from 'zod';

export const menuCreateSchema = z.object({
    nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    deskripsi: z.string().max(500).optional(),
    kategori: z.string().default('Sate'),
    image: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
    protein: z.string().default('Ayam'),
    harga: z.number({ message: 'Harga wajib diisi dan harus berupa angka' }).int().positive('Harga harus positif'),
    stok: z.number().int().min(0).default(100),
    low_stock_threshold: z.number().int().min(0).default(10),
    level_pedas_min: z.number().int().min(0).max(10).default(0),
    level_pedas_max: z.number().int().min(0).max(10).default(5),
    kalori: z.number().int().min(0).default(0),
    favorit: z.boolean().default(false),
    tersedia: z.boolean().default(true),
});

export const menuUpdateSchema = menuCreateSchema.partial();

export type MenuCreateInput = z.infer<typeof menuCreateSchema>;
export type MenuUpdateInput = z.infer<typeof menuUpdateSchema>;
