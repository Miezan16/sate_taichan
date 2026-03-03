// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
    userId: number;
    username: string;
    role: 'admin' | 'kasir';
}

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    return new TextEncoder().encode(secret);
};

export async function signToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}
