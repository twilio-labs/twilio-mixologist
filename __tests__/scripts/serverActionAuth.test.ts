import { describe, test, expect, vi, beforeEach } from "vitest";

const { authHeader, sendMessage, getPinnedSender, mintToken } = vi.hoisted(() => {
  process.env.ADMIN_LOGIN = "admin:adminpw";
  process.env.MIXOLOGIST_LOGIN = "mixo:mixopw";
  process.env.KIOSK_LOGIN = "kiosk:kioskpw";
  return {
    authHeader: { value: "" },
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getPinnedSender: vi.fn().mockResolvedValue("+1555"),
    mintToken: vi.fn().mockResolvedValue("jwt"),
  };
});

vi.mock("next/headers", () => ({
  headers: async () => new Headers(authHeader.value ? { Authorization: authHeader.value } : {}),
}));
vi.mock("@/lib/twilio", () => ({
  sendMessage,
  getPinnedSender,
  createToken: mintToken,
}));

import * as actions from "@/lib/actions";

const basic = (u: string, p: string) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");

beforeEach(() => {
  vi.clearAllMocks();
  authHeader.value = "";
});

describe("server actions authorization", () => {
  test("only the intended actions are exported", () => {
    expect(Object.keys(actions).sort()).toEqual(["createToken", "getPinnedSender", "sendMessage"]);
  });

  test.each([
    ["no header", ""],
    ["bad password", basic("admin", "nope")],
    ["kiosk role", basic("kiosk", "kioskpw")],
    ["malformed header", "Basic"],
  ])("sendMessage rejects %s", async (_n, header) => {
    authHeader.value = header;
    await expect(actions.sendMessage("+1555", "hi")).rejects.toThrow("Not authorized");
    await expect(actions.getPinnedSender("Attendees", "+1555")).rejects.toThrow("Not authorized");
    expect(sendMessage).not.toHaveBeenCalled();
    expect(getPinnedSender).not.toHaveBeenCalled();
  });

  test.each([
    ["admin", basic("admin", "adminpw")],
    ["mixologist", basic("mixo", "mixopw")],
  ])("sendMessage allows %s", async (_n, header) => {
    authHeader.value = header;
    await actions.sendMessage("+1555", "hi", "", "", "from");
    expect(sendMessage).toHaveBeenCalledWith("+1555", "hi", "", "", "from");
  });

  test("createToken uses the role derived from the header, not client input", async () => {
    await actions.createToken();
    expect(mintToken).toHaveBeenLastCalledWith("unknown");
    authHeader.value = basic("mixo", "mixopw");
    await actions.createToken();
    expect(mintToken).toHaveBeenLastCalledWith("mixologist");
  });
});
