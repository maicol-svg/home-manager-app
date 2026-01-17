import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
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

  // Route pubbliche (non richiedono autenticazione)
  const publicPaths = ["/login", "/register", "/auth/callback"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Route che non richiedono household (ma richiedono auth)
  const noHouseholdPaths = ["/onboarding"];
  const isNoHouseholdPath = noHouseholdPaths.some((path) => pathname.startsWith(path));

  // Se non autenticato e non su pagine pubbliche, redirect a login
  if (!user && !isPublicPath && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se autenticato e su pagine auth, redirect a dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Se autenticato e su pagine che richiedono household, verifica membership
  if (user && !isPublicPath && !isNoHouseholdPath && pathname !== "/") {
    // Verifica se l'utente ha un household
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    // Se non ha household, redirect a onboarding
    if (!membership) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Se autenticato, ha household, e sta andando a onboarding, redirect a dashboard
  if (user && pathname === "/onboarding") {
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
