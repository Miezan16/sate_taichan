// src/proxy.ts — Next.js 16 route protection (replaces deprecated middleware.ts)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;

    // --- Proteksi /dashboard (hanya ADMIN) ---
    if (pathname.startsWith('/dashboard')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (session.role !== 'admin') {
            // Kasir yang nyasar ke /dashboard → redirect ke /pos
            return NextResponse.redirect(new URL('/pos', request.url));
        }
    }

    // --- Proteksi /pos (kasir + admin) ---
    if (pathname.startsWith('/pos')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Semua role yang terautentikasi boleh akses /pos
    }

    // --- Halaman login: jika sudah login, redirect ke halaman sesuai role ---
    if (pathname === '/login') {
        if (session) {
            const redirectTo = session.role === 'admin' ? '/dashboard' : '/pos';
            return NextResponse.redirect(new URL(redirectTo, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/pos/:path*', '/dashboard/:path*', '/login'],
};
