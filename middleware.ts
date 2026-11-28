import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
const clerk = clerkMiddleware();
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY) {
    // Public previews remain reviewable. Private job endpoints fail closed.
    if (/^\/api\/chat\/jobs(?:\/|$)/.test(request.nextUrl.pathname)) {
      return NextResponse.json({ error: 'auth_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.next();
  }
  return clerk(request, event);
}
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
