import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthRoute = pathname.startsWith("/auth/");
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/driver");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Let /auth/* (callback, signout) through untouched.
  if (isAuthRoute) return supabaseResponse;

  // Role guard: owners belong on /owner/*, drivers on /driver/*.
  // Server-side redirect, so a wrong-role visit settles in one hop
  // and can never ping-pong like a client-side check could.
  if (user) {
    const wantsOwner = pathname.startsWith("/owner");
    const wantsDriver = pathname.startsWith("/driver");
    if (wantsOwner || wantsDriver) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const url = request.nextUrl.clone();
      if (!profile) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
      if (wantsOwner && profile.role !== "owner") {
        url.pathname = "/driver";
        return NextResponse.redirect(url);
      }
      if (wantsDriver && profile.role !== "driver") {
        url.pathname = "/owner";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
