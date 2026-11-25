// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

// proxy.ts reads the *_LOGIN variables when it loads, so each test sets them
// and imports a fresh copy.
async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const name of ["ADMIN_LOGIN", "MIXOLOGIST_LOGIN", "KIOSK_LOGIN"]) {
    vi.stubEnv(name, env[name] ?? "");
  }
  return import("@/proxy");
}

const basic = (credentials: string) =>
  "Basic " + Buffer.from(credentials).toString("base64");

const configured = {
  ADMIN_LOGIN: "admin:adminpass",
  MIXOLOGIST_LOGIN: "mixer:mixpass",
  KIOSK_LOGIN: "kiosk:kioskpass",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAuthenticatedRole", () => {
  test("empty credentials don't log in when no login is configured", async () => {
    const { getAuthenticatedRole, Privilege } = await load({});
    expect(getAuthenticatedRole("Basic Og==")).toBe(Privilege.UNKNOWN);
    expect(getAuthenticatedRole(basic(":"))).toBe(Privilege.UNKNOWN);
  });

  test("an unset ADMIN_LOGIN disables only the admin role", async () => {
    const { getAuthenticatedRole, Privilege } = await load({
      ...configured,
      ADMIN_LOGIN: undefined,
    });
    expect(getAuthenticatedRole("Basic Og==")).toBe(Privilege.UNKNOWN);
    expect(getAuthenticatedRole(basic("mixer:mixpass"))).toBe(
      Privilege.MIXOLOGIST,
    );
  });

  test("a login with an empty user or password disables its role", async () => {
    const { getAuthenticatedRole, Privilege } = await load({
      ADMIN_LOGIN: "admin:",
      MIXOLOGIST_LOGIN: ":mixpass",
      KIOSK_LOGIN: "kiosk",
    });
    expect(getAuthenticatedRole(basic("admin:"))).toBe(Privilege.UNKNOWN);
    expect(getAuthenticatedRole(basic(":mixpass"))).toBe(Privilege.UNKNOWN);
    expect(getAuthenticatedRole(basic("kiosk:"))).toBe(Privilege.UNKNOWN);
  });

  test("each configured role still logs in", async () => {
    const { getAuthenticatedRole, Privilege } = await load(configured);
    expect(getAuthenticatedRole(basic("admin:adminpass"))).toBe(
      Privilege.ADMIN,
    );
    expect(getAuthenticatedRole(basic("mixer:mixpass"))).toBe(
      Privilege.MIXOLOGIST,
    );
    expect(getAuthenticatedRole(basic("kiosk:kioskpass"))).toBe(
      Privilege.KIOSK,
    );
    expect(getAuthenticatedRole(basic("admin:wrong"))).toBe(Privilege.UNKNOWN);
  });

  test("a password may contain a colon", async () => {
    const { getAuthenticatedRole, Privilege } = await load({
      ADMIN_LOGIN: "admin:pa:ss",
    });
    expect(getAuthenticatedRole(basic("admin:pa:ss"))).toBe(Privilege.ADMIN);
    expect(getAuthenticatedRole(basic("admin:pa"))).toBe(Privilege.UNKNOWN);
  });

  test("a malformed header gives UNKNOWN instead of throwing", async () => {
    const { getAuthenticatedRole, Privilege } = await load(configured);
    for (const header of [
      "Basic",
      "Basic ",
      "Bearer abc",
      "garbage",
      basic("nocolon"),
    ]) {
      expect(getAuthenticatedRole(header)).toBe(Privilege.UNKNOWN);
    }
  });
});

describe("proxy /login", () => {
  test("answers empty credentials with a 401 when ADMIN_LOGIN is unset", async () => {
    const { proxy } = await load({ ...configured, ADMIN_LOGIN: undefined });
    const res = proxy(
      new NextRequest("http://localhost/login", {
        headers: { authorization: "Basic Og==" },
      }),
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toBe(
      'Basic realm="Mixologist"',
    );
    expect(res.cookies.get("privilege")).toBeUndefined();
  });

  test("sets the privilege cookie for a configured login", async () => {
    const { proxy } = await load(configured);
    const res = proxy(
      new NextRequest("http://localhost/login", {
        headers: { authorization: basic("kiosk:kioskpass") },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.cookies.get("privilege")?.value).toBe("kiosk");
  });
});
