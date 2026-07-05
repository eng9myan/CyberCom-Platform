import { NextRequest, NextResponse } from "next/server";

/**
 * Maps each flagship product subdomain to its existing path-based route
 * under src/app/. One Next.js deployment serves all subdomains; this
 * middleware makes each subdomain look like its own standalone app by
 * rewriting "/" and deep links onto the matching route tree.
 */
const SUBDOMAIN_TO_PATH: Record<string, string> = {
  hospital: "/hospital",
  clinic: "/clinic",
  pharmacy: "/pharmacy",
  laboratory: "/laboratory",
  imaging: "/imaging",
  erp: "/erp",
};

const PASSTHROUGH_PREFIXES = ["/_next", "/api", "/static", "/favicon.ico"];

function resolveSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0] ?? host;
  // production: hospital.cy-com.com ; local dev: hospital.localhost
  const candidate = hostname.split(".")[0] ?? "";
  return candidate in SUBDOMAIN_TO_PATH ? candidate : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const subdomain = resolveSubdomain(request.headers.get("host"));
  if (!subdomain) {
    return NextResponse.next();
  }

  const productBasePath = SUBDOMAIN_TO_PATH[subdomain];
  if (!productBasePath || pathname.startsWith(productBasePath)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `${productBasePath}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
