// src/app/api/admin/log/route.ts
// GET — List activity logs (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/adminGuard';

export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { created_at: 'desc' },
            take: 100,
            include: {
                user: { select: { username: true } },
            },
        });
        return NextResponse.json(logs, { status: 200 });
    } catch (error) {
        console.error('❌ Error GET /api/admin/log:', error);
        return NextResponse.json({ error: 'Gagal mengambil log aktivitas' }, { status: 500 });
    }
}
