import { describe, test, expect, vi, beforeEach } from "vitest";

const { authHeader, sendMessage, getPinnedSender, mintToken, readyMsg, reminderMsg, cancelledMsg } = vi.hoisted(() => {
  process.env.ADMIN_LOGIN = "admin:adminpw";
  process.env.MIXOLOGIST_LOGIN = "mixo:mixopw";
  process.env.KIOSK_LOGIN = "kiosk:kioskpw";
  return {
    authHeader: { value: "" },
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getPinnedSender: vi.fn().mockResolvedValue("+1555"),
    mintToken: vi.fn().mockResolvedValue("jwt"),
    readyMsg: vi.fn().mockResolvedValue({ contentSid: "HX1" }),
    reminderMsg: vi.fn().mockResolvedValue({ contentSid: "HX2" }),
    cancelledMsg: vi.fn().mockResolvedValue({ contentSid: "HX3" }),
  };
});

vi.mock("next/headers", () => ({
  headers: async () => new Headers(authHeader.value ? { Authorization: authHeader.value } : {}),
}));
vi.mock("@/lib/twilio", () => ({
  sendMessageAndWait: sendMessage,
  getPinnedSender,
  createToken: mintToken,
}));

vi.mock("@/scripts/fetchContentTemplates", () => ({
  getOrderReadyMessage: readyMsg,
  getOrderReadyReminderMessage: reminderMsg,
  getOrderCancelledMessage: cancelledMsg,
}));

import * as actions from "@/lib/actions";

const basic = (u: string, p: string) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");

beforeEach(() => {
  vi.clearAllMocks();
  authHeader.value = "";
});

describe("server actions authorization", () => {
  test("only the intended actions are exported", () => {
    expect(Object.keys(actions).sort()).toEqual([
      "createToken",
      "getOrderCancelledMessage",
      "getOrderReadyMessage",
      "getOrderReadyReminderMessage",
      "getPinnedSender",
      "sendMessage",
    ]);
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
    await expect(actions.getOrderReadyMessage("Espresso", "1", "Bar")).rejects.toThrow("Not authorized");
    await expect(actions.getOrderReadyReminderMessage("Espresso", "1", "Bar")).rejects.toThrow("Not authorized");
    expect(sendMessage).not.toHaveBeenCalled();
    expect(getPinnedSender).not.toHaveBeenCalled();
    await expect(actions.getOrderCancelledMessage("Espresso", "1")).rejects.toThrow("Not authorized");
    expect(cancelledMsg).not.toHaveBeenCalled();
    expect(readyMsg).not.toHaveBeenCalled();
    expect(reminderMsg).not.toHaveBeenCalled();
  });

  test.each([
    ["admin", basic("admin", "adminpw")],
    ["mixologist", basic("mixo", "mixopw")],
  ])("sendMessage allows %s", async (_n, header) => {
    authHeader.value = header;
    await actions.sendMessage("+1555", "hi", "", "", "from");
    expect(sendMessage).toHaveBeenCalledWith("+1555", "hi", "", "", "from");
  });

  test("template lookups pass through for staff", async () => {
    authHeader.value = basic("mixo", "mixopw");
    await actions.getOrderReadyMessage("Espresso", "1", "Bar", "en");
    expect(readyMsg).toHaveBeenCalledWith("Espresso", "1", "Bar", "en");
    await actions.getOrderReadyReminderMessage("Espresso", "1", "Bar");
    expect(reminderMsg).toHaveBeenCalled();
    await actions.getOrderCancelledMessage("Espresso", "1", "en");
    expect(cancelledMsg).toHaveBeenCalledWith("Espresso", "1", "en");
  });

  test("createToken uses the role derived from the header, not client input", async () => {
    await actions.createToken();
    expect(mintToken).toHaveBeenLastCalledWith("unknown");
    authHeader.value = basic("mixo", "mixopw");
    await actions.createToken();
    expect(mintToken).toHaveBeenLastCalledWith("mixologist");
  });
});
