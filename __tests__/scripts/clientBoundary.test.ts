import { describe, test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Server-only modules need secrets that don't exist in the browser. Since they
// are no longer "use server" files, a client component importing one directly
// would silently run in the browser and fail at runtime (e.g. 401s). Client
// components must go through src/lib/actions.ts instead.
const FORBIDDEN = [
  /from\s+["']@\/scripts\/fetchContentTemplates["']/,
  /from\s+["']@\/lib\/twilio(\/[\w-]+)?["']/,
  /from\s+["']@\/app\/webhooks\/[^"']*["']/,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

describe("client/server boundary", () => {
  test("client components do not import server-only modules", () => {
    const offenders: string[] = [];
    for (const file of walk("src")) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(src.split("\n").slice(0, 5).join("\n"))) continue;
      for (const re of FORBIDDEN) {
        if (re.test(src)) offenders.push(`${file} matches ${re}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
