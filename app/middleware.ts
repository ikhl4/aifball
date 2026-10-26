import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// يمكنك لاحقاً تحديد المسارات التي تتطلب تسجيل دخول إجباري هنا
const isProtectedRoute = createRouteMatcher([
  // '/api/chat(.*)', 
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // استثناء ملفات Next.js الداخلية والملفات الثابتة والصور
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // تشغيل الـ middleware دائما لطلبات الـ API
    '/(api|trpc)(.*)',
  ],
};
