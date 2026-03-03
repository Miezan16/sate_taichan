// src/lib/adminGuard.ts
// Helper: Validasi session dan pastikan user adalah ADMIN
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { JWTPayload } from './auth';

export async function requireAdmin(
    request: NextRequest
): Promise<{ session: JWTPayload } | NextResponse> {
    const session = await getSession(request);

    if (!session) {
        return NextResponse.json(
            { error: 'Tidak terautentikasi. Silakan login.' },
            { status: 401 }
        );
    }

    if (session.role !== 'admin') {
        return NextResponse.json(
            { error: 'Akses ditolak. Hanya Admin yang diizinkan.' },
            { status: 403 }
        );
    }

    return { session };
}

// Type guard untuk cek apakah hasil requireAdmin adalah error response
export function isErrorResponse(
    result: { session: JWTPayload } | NextResponse
): result is NextResponse {
    return result instanceof NextResponse;
}
