import { getShowHelpTemplate } from "@/scripts/buildContentTemplates";
import { describe, expect, test } from "vitest";

describe("getShowHelpTemplate", () => {
  test("should return an object with the correct structure", () => {
    const result = getShowHelpTemplate(1, "testTemplate");
    expect(result).toHaveProperty("friendly_name", "testTemplate");
    expect(result).toHaveProperty("language", "en");
    expect(result).toHaveProperty("variables");
    expect(result).toHaveProperty("types");
  });

  test("should return an object with the correct number of variables", () => {
    const numOptions = 2;
    const result = getShowHelpTemplate(numOptions, "testTemplate");
    expect(Object.keys(result.variables)).toHaveLength(numOptions * 3);
  });

  test("should return an object with the correct types", () => {
    const result = getShowHelpTemplate(1, "testTemplate");
    expect(result.types).toHaveProperty("twilio/list-picker");
    expect(result.types).toHaveProperty("twilio/text");
  });

  test('should return an object with the correct number of items in "twilio/list-picker"', () => {
    const numOptions = 2;
    const result = getShowHelpTemplate(numOptions, "testTemplate");
    expect(result.types["twilio/list-picker"]?.items).toHaveLength(numOptions);
  });

  test("all values in the returned variables should be empty strings", () => {
    const numOptions = Math.floor(Math.random() * 10) + 1; // random number between 1 and 10
    const result = getShowHelpTemplate(numOptions, "testTemplate");
    const values = Object.values(result.variables);
    values.forEach((value) => expect(value).toBe(""));
  });
});

