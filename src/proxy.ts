import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/lib/site";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathLocale = request.nextUrl.pathname.split("/")[1] ?? "";
  requestHeaders.set("x-tooyei-locale", isLocale(pathLocale) ? pathLocale : "zh");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|.*\\..*).*)"],
};
