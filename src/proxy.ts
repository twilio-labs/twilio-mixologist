import { NextResponse, NextRequest } from "next/server";

export enum Privilege {
  ADMIN = "admin",
  MIXOLOGIST = "mixologist",
  KIOSK = "kiosk",
  UNKNOWN = "unknown",
}

type Credentials = { user: string; pass: string };

// Splits "user:password" on the first ":", so a password may contain ":".
// Anything without a non-empty user and password gives null.
function parseCredentials(value: string | undefined): Credentials | null {
  if (!value) return null;
  const at = value.indexOf(":");
  if (at < 0) return null;
  const user = value.slice(0, at);
  const pass = value.slice(at + 1);
  return user && pass ? { user, pass } : null;
}

// A role whose *_LOGIN is unset or incomplete can't be logged into: it fails
// closed instead of accepting empty credentials.
const LOGINS: [Privilege, Credentials | null][] = [
  [Privilege.ADMIN, parseCredentials(process.env.ADMIN_LOGIN)],
  [Privilege.MIXOLOGIST, parseCredentials(process.env.MIXOLOGIST_LOGIN)],
  [Privilege.KIOSK, parseCredentials(process.env.KIOSK_LOGIN)],
];

const REALM = 'Basic realm="Mixologist"';
const LOGGED_OUT_COOKIE = "logged_out";
const NO_STORE: HeadersInit = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/logout") {
    return handleLogout(req);
  }
  if (req.nextUrl.pathname === "/login") {
    return handleLogin(req);
  }
  return handleStaffPage(req);
}

/**
 * Pages that are never meant to be public. Everything else (home, the event
 * queue/menu views) is intentionally readable by anonymous visitors; what they
 * can read or do is enforced by Sync ACLs, the API routes and the Server
 * Actions in src/lib/actions.ts, not by this middleware.
 */
const STAFF_PAGES: { pattern: RegExp; roles: Privilege[] }[] = [
  { pattern: /^\/configuration(\/|$)/, roles: [Privilege.ADMIN, Privilege.MIXOLOGIST] },
  { pattern: /^\/sync(\/|$)/, roles: [Privilege.ADMIN, Privilege.MIXOLOGIST] },
  { pattern: /^\/event\/[^/]+\/stats(\/|$)/, roles: [Privilege.ADMIN] },
];

function handleStaffPage(req: NextRequest) {
  const rule = STAFF_PAGES.find((r) => r.pattern.test(req.nextUrl.pathname));
  if (!rule) return NextResponse.next();

  const role = getAuthenticatedRole(
    req.headers.get("authorization") || req.headers.get("Authorization"),
  );
  if (role === Privilege.UNKNOWN) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM, ...NO_STORE },
    });
  }
  if (!rule.roles.includes(role)) {
    return new NextResponse("Forbidden", { status: 403, headers: NO_STORE });
  }
  return NextResponse.next();
}

function handleLogout(req: NextRequest) {
  // POST-only to defeat CSRF (e.g. <img src="/logout"> from a third-party site).
  if (req.method !== "POST") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // 303 See Other so the browser follows with GET after the POST.
  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.delete({ name: "privilege", path: "/" });
  // Session cookie (no maxAge) so the next /login hit forces a 401 with
  // WWW-Authenticate regardless of how long the user waits, invalidating the
  // browser's cached Basic Auth credentials for the realm. Cleared on the
  // next /login request; also cleared when the browser closes.
  response.cookies.set(LOGGED_OUT_COOKIE, "1", {
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
      headers: { "WWW-Authenticate": REALM, ...NO_STORE },
    });
    challenge.cookies.delete({ name: LOGGED_OUT_COOKIE, path: "/" });
    return challenge;
  }

  const response = NextResponse.next();
  const authheader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const role = getAuthenticatedRole(authheader);

  if (role === Privilege.UNKNOWN) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": REALM, ...NO_STORE },
    });
  }

  const ONE_DAY = 60 * 60 * 24;
  response.cookies.set("privilege", role, { path: "/", maxAge: ONE_DAY });
  return response;
}

export function getAuthenticatedRole(authheader: string | null) {
  if (!authheader) return Privilege.UNKNOWN;
  const [scheme, encoded] = authheader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "basic" || !encoded) return Privilege.UNKNOWN;
  const given = parseCredentials(Buffer.from(encoded, "base64").toString());
  if (!given) return Privilege.UNKNOWN;

  for (const [role, login] of LOGINS) {
    if (login && given.user === login.user && given.pass === login.pass) {
      return role;
    }
  }
  return Privilege.UNKNOWN;
}

export const config = {
  matcher: ["/login", "/logout", "/configuration/:path*", "/sync/:path*", "/event/:slug/stats/:path*"],
};
