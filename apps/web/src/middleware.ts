import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get('host') || '';
  const path = url.pathname;

  // Extract subdomain from host
  const hostParts = host.split('.');
  const isSubdomain = hostParts.length > 2 && hostParts[0] !== 'www';

  if (isSubdomain) {
    const subdomain = hostParts[0];
    // Rewrite to store route with subdomain param
    url.pathname = `/store/${subdomain}${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  // Main domain routes - dashboard, auth, landing
  if (path.startsWith('/dashboard') || path.startsWith('/auth') || path === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
