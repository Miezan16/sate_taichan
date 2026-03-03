// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
    const session = await getSession(request);

    if (!session) {
        return NextResponse.json(
            { error: 'Tidak terautentikasi' },
            { status: 401 }
        );
    }

    return NextResponse.json({
        id: session.userId,
        username: session.username,
        role: session.role,
    });
}
