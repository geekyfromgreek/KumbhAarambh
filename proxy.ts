import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/nashikkar(.*)",
]);

// Routes where yatri access is needed (auth OR guest cookie)
const isYatriRoute = createRouteMatcher([
  "/yatri(.*)",
]);

// Clerk middleware wraps our custom proxy logic
const clerkProxy = clerkMiddleware(async (auth, req: NextRequest) => {
  // For Nashikkar routes: always require Clerk auth
  if (isProtectedRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // For Yatri routes: allow if guest cookie OR authenticated
  if (isYatriRoute(req)) {
    const guestCookie = req.cookies.get("kumbh_guest_session")?.value;
    if (guestCookie === "true") {
      // Guest pilgrim bypass — allow without authentication
      return NextResponse.next();
    }
    // Not a guest → require Clerk authentication
    await auth.protect();
    return NextResponse.next();
  }

  return NextResponse.next();
});

// Next.js 16 uses `proxy` instead of `middleware`
export function proxy(request: NextRequest) {
  return clerkProxy(request, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
