import { describe, expect, test } from "vitest";
import { getDataPolicy, isForgetMeRequest } from "@/lib/stringTemplates";
import type { Language } from "@/types";

const DELETE_PHRASES: Record<Language, string> = {
  en: "Forget me",
  "pt-BR": "Esqueça de mim",
  fr: "Oubliez-moi",
};

describe("getDataPolicy delete notice", () => {
  test.each(Object.entries(DELETE_PHRASES))(
    "%s policy tells users to reply with %s",
    (language, phrase) => {
      expect(getDataPolicy("barista", language as Language)).toContain(phrase);
    },
  );

  test.each(Object.entries(DELETE_PHRASES))(
    "%s phrase %s triggers data deletion",
    (_language, phrase) => {
      expect(isForgetMeRequest(phrase)).toBe(true);
    },
  );

  test("matches phrases case-insensitively inside a longer message", () => {
    expect(isForgetMeRequest("Please FORGET ME now")).toBe(true);
    expect(isForgetMeRequest("oublie-moi s'il vous plaît")).toBe(true);
  });

  test("ignores ordinary messages", () => {
    expect(isForgetMeRequest("One cappuccino please")).toBe(false);
  });
});
