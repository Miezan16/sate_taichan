import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Di Next.js terbaru, nama fungsinya menyesuaikan konvensi proxy
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Ambil hostname (domain)
  const hostname = req.headers.get("host") || "";

  // Pengaturan Domain Kamu
  // localhost:3000 ditambahkan agar bisa di-test di komputer
  const isPelangganDomain =
    hostname === "sadjodo.com" ||
    hostname === "www.sadjodo.com" ||
    hostname === "localhost:3000";
  const isAdminDomain =
    hostname === "login.sadjodo.com" || hostname === "login.localhost:3000";

  // Cegah rewrite berulang jika sudah di folder yang benar
  if (
    url.pathname.startsWith("/pelanggan") ||
    url.pathname.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  // 1. Jika yang diakses adalah domain ADMIN/KASIR (login.sadjodo.com)
  if (isAdminDomain) {
    url.pathname = `/login${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. Jika yang diakses adalah domain PELANGGAN (sadjodo.com)
  if (isPelangganDomain) {
    url.pathname = `/pelanggan${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Abaikan semua jalur (path) yang berawalan:
     * - api (API routes)
     * - _next/static (file statis dari Next.js)
     * - _next/image (fitur optimasi gambar Next.js)
     * - favicon.ico
     * - dan abaikan SEMUA FILE yang memiliki ekstensi gambar (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
