import { describe, expect, test } from "vitest";
import { getSampleOrder } from "@/lib/stringTemplates";
import { modes } from "@/types";

const item = (title: string) => ({ title, shortTitle: title, description: "" });

describe("getSampleOrder", () => {
  test("uses the second menu item when there are several", () => {
    const selection = {
      items: [item("Espresso"), item("Cappuccino")],
      modifiers: [],
      mode: modes.barista,
    };
    expect(getSampleOrder(selection)).toBe("Cappuccino");
  });

  test("falls back to the only menu item", () => {
    const selection = { items: [item("Espresso")], modifiers: [], mode: modes.barista };
    expect(getSampleOrder(selection)).toBe("Espresso");
  });

  test("returns no sample order when the menu is empty", () => {
    const selection = { items: [], modifiers: ["Oat Milk"], mode: modes.barista };
    expect(getSampleOrder(selection)).toBe("");
  });

  test("adds the last modifier", () => {
    const selection = {
      items: [item("Espresso"), item("Cappuccino")],
      modifiers: ["Soy Milk", "Oat Milk"],
      mode: modes.barista,
    };
    expect(getSampleOrder(selection)).toBe("Cappuccino with Oat Milk");
  });

  test.each([
    ["pt-BR", "Cappuccino com Oat Milk"],
    ["fr", "Cappuccino avec Oat Milk"],
  ] as const)("joins the modifier in %s", (language, expected) => {
    const selection = {
      items: [item("Espresso"), item("Cappuccino")],
      modifiers: ["Oat Milk"],
      mode: modes.barista,
    };
    expect(getSampleOrder(selection, language)).toBe(expected);
  });
});
