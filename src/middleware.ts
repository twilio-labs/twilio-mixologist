import { NextResponse, NextRequest } from "next/server";

export enum Privilege {
  ADMIN = "admin",
  MIXOLOGIST = "mixologist",
  UNKNOWN = "unknown",
}

const [ADMIN_USER, ADMIN_PASS] = (process.env.ADMIN_LOGIN || ":").split(":");
const [MIXOLOGIST_USER, MIXOLOGIST_PASS] = (
  process.env.MIXOLOGIST_LOGIN || ":"
).split(":");

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const authheader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const role = getAuthenticatedRole(authheader);

  if (role === Privilege.UNKNOWN) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  const ONE_DAY = 60 * 60 * 24;
  response.cookies.set("privilege", role, { maxAge: ONE_DAY });
  return response;
}

export function getAuthenticatedRole(authheader: string | null) {
  if (!authheader) return Privilege.UNKNOWN;
  const [user, pass] = Buffer.from(authheader.split(" ")[1], "base64")
    .toString()
    .split(":");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return Privilege.ADMIN;
  } else if (user === MIXOLOGIST_USER && pass === MIXOLOGIST_PASS) {
    return Privilege.MIXOLOGIST;
  } else {
    return Privilege.UNKNOWN;
  }
}

export const config = {
  matcher: ["/login"],
};
