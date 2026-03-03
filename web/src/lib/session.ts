// src/lib/session.ts
import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export const SESSION_COOKIE_NAME = 'pos_session';

export async function getSession(request: NextRequest): Promise<JWTPayload | null> {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}
