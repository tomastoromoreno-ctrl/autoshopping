import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BASE_DOMAINS = ['vercel.app', 'netlify.app', 'railway.app', 'onrender.com'];

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get('host') || '';
  const path = url.pathname;

  const hostParts = host.split('.');
  const isSubdomain = hostParts.length > 2 && !BASE_DOMAINS.some((d) => host.endsWith(d));

  if (isSubdomain) {
    const subdomain = hostParts[0];
    url.pathname = `/store/${subdomain}${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
