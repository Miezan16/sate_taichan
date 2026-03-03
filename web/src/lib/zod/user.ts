// src/lib/zod/user.ts
// Zod schemas untuk validasi input User Management API
import { z } from 'zod';

export const userCreateSchema = z.object({
    username: z.string().min(3, 'Username minimal 3 karakter').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.enum(['admin', 'kasir']).default('kasir'),
    cabang_id: z.number().int().positive().optional().nullable(),
});

export const userUpdateSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
    password: z.string().min(6).optional(),  // Akan di-hash jika diisi
    role: z.enum(['admin', 'kasir']).optional(),
    cabang_id: z.number().int().positive().optional().nullable(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
