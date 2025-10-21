import { describe, expect, test } from "vitest";
import { Configuration, mergeConfig } from "@/scripts/updateConfig";

describe("Test if mergeConfig", () => {
  test("correctly merges distinct senders from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2"],
    };

    const newConfig: Configuration = {
      menus: {},
      possibleSenders: ["newSender1"],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2", "newSender1"],
    });
  });

  test("correctly merges overlapping senders from new and old configurations and no conflict", () => {
    const oldConfig: Configuration = {
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2"],
    };

    const newConfig: Configuration = {
      menus: {},
      possibleSenders: ["newSender1", "oldSender2"],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2", "newSender1"],
    });
  });

  test("correctly merges overlapping senders and keeps turned on flag for WhatsApp", () => {
    const oldConfig: Configuration = {
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2"],
    };

    const newConfig: Configuration = {
      menus: {},
      possibleSenders: ["oldSender2"],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      possibleSenders: ["oldSender1", "oldSender2"],
    });
  });

  test("correctly merges additive menus from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {
        oldMenu1: {
          items: [
            {
              shortTitle: "oldItem1",
              title: "oldItem1",
              description: "oldItem1",
            },
            {
              shortTitle: "oldItem2",
              title: "oldItem2",
              description: "oldItem2",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "oldItem3",
              title: "oldItem3",
              description: "oldItem3",
            },
            {
              shortTitle: "oldItem4",
              title: "oldItem4",
              description: "oldItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    };

    const newConfig: Configuration = {
      menus: {
        newMenu1: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {
        newMenu1: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    });
  });

  test("correctly merges additive menus items from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {
        oldMenu1: {
          items: [
            {
              shortTitle: "oldItem1",
              title: "oldItem1",
              description: "oldItem1",
            },
            {
              shortTitle: "oldItem2",
              title: "oldItem2",
              description: "oldItem2",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "oldItem3",
              title: "oldItem3",
              description: "oldItem3",
            },
            {
              shortTitle: "oldItem4",
              title: "oldItem4",
              description: "oldItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    };

    const newConfig: Configuration = {
      menus: {
        newMenu1: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {
        newMenu1: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
        oldMenu2: {
          items: [
            {
              shortTitle: "newItem1",
              title: "newItem1",
              description: "newItem1",
            },
            {
              shortTitle: "newItem2",
              title: "newItem2",
              description: "newItem2",
            },
            {
              shortTitle: "newItem3",
              title: "newItem3",
              description: "newItem3",
            },
            {
              shortTitle: "newItem4",
              title: "newItem4",
              description: "newItem4",
            },
          ],
        },
      },
      possibleSenders: [],
    });
  });

  // test("should return zero when adding zero to a number", () => {
  //   const result = add(10, 0);
  //   expect(result).toBe(10);
  // });

  // test("should return a negative number when adding a negative and a positive number", () => {
  //   const result = add(-5, 8);
  //   expect(result).toBe(3);
  // });
});
