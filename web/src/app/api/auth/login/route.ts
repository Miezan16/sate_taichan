// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username dan password wajib diisi' },
                { status: 400 }
            );
        }

        // Cari user di database
        const user = await prisma.user.findUnique({
            where: { username: username.trim() },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Username atau password salah' },
                { status: 401 }
            );
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Username atau password salah' },
                { status: 401 }
            );
        }

        // Buat JWT token
        const token = await signToken({
            userId: user.id,
            username: user.username,
            role: user.role as 'admin' | 'kasir',
        });

        // Tentukan redirect berdasarkan role
        const redirectTo = user.role === 'admin' ? '/dashboard' : '/pos';

        // Set response dengan cookie
        const response = NextResponse.json({
            user: { id: user.id, username: user.username, role: user.role },
            redirectTo,
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8, // 8 jam
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('❌ Login error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
