import { NextResponse, NextRequest } from "next/server";

export enum Privilege {
  ADMIN = "admin",
  MIXOLOGIST = "mixologist",
  KIOSK = "kiosk",
  UNKNOWN = "unknown",
}

const [ADMIN_USER, ADMIN_PASS] = (process.env.ADMIN_LOGIN || ":").split(":");
const [MIXOLOGIST_USER, MIXOLOGIST_PASS] = (
  process.env.MIXOLOGIST_LOGIN || ":"
).split(":");
const [KIOSK_USER, KIOSK_PASS] = (process.env.KIOSK_LOGIN || ":").split(":");

const REALM = 'Basic realm="Mixologist"';
const LOGGED_OUT_COOKIE = "logged_out";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/logout") {
    return handleLogout(req);
  }
  return handleLogin(req);
}

function handleLogout(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", req.url));
  response.cookies.delete("privilege");
  // Marker so the next /login hit forces a 401 with WWW-Authenticate,
  // invalidating the browser's cached Basic Auth credentials for the realm.
  response.cookies.set(LOGGED_OUT_COOKIE, "1", {
    maxAge: 60,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}

function handleLogin(req: NextRequest) {
  // If the user just logged out, force a 401 once so the browser drops any
  // cached Authorization header and re-prompts for credentials.
  if (req.cookies.get(LOGGED_OUT_COOKIE)?.value === "1") {
    const challenge = new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM },
    });
    challenge.cookies.delete(LOGGED_OUT_COOKIE);
    return challenge;
  }

  const response = NextResponse.next();
  const authheader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const role = getAuthenticatedRole(authheader);

  if (role === Privilege.UNKNOWN) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM },
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
  } else if (user === KIOSK_USER && pass === KIOSK_PASS) {
    return Privilege.KIOSK;
  } else {
    return Privilege.UNKNOWN;
  }
}

export const config = {
  matcher: ["/login", "/logout"],
};
