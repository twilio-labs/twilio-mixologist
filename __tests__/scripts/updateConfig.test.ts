import { describe, expect, test } from "vitest";
import { Configuration, mergeConfig } from "@/scripts/updateConfig";

describe("Test if mergeConfig", () => {
  test("correctly merges distinct senders from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: false, smsChannel: true },
      ],
    };

    const newConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "newSender1", whatsappChannel: null, smsChannel: false },
      ],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: false, smsChannel: true },
        { sender: "newSender1", whatsappChannel: false, smsChannel: false },
      ],
    });
  });

  test("correctly merges overlapping senders from new and old configurations and no conflict", () => {
    const oldConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: false, smsChannel: true },
      ],
    };

    const newConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "newSender1", whatsappChannel: null, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: null, smsChannel: true },
      ],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: false, smsChannel: true },
        { sender: "newSender1", whatsappChannel: false, smsChannel: false },
      ],
    });
  });

  test("correctly merges overlapping senders and keeps turned on flag for WhatsApp", () => {
    const oldConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: true, smsChannel: true },
      ],
    };

    const newConfig: Configuration = {
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender2", whatsappChannel: null, smsChannel: true },
      ],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      spellingMistakes: {},
      possibleSenders: [
        { sender: "oldSender1", whatsappChannel: true, smsChannel: false },
        { sender: "oldSender2", whatsappChannel: true, smsChannel: true },
      ],
    });
  });

  test("correctly merges overlapping spelling mistakes from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {},
      spellingMistakes: {
        oldMistake1: "oldCorrection1",
        oldMistake2: "oldCorrection2",
      },
      possibleSenders: [],
    };

    const newConfig: Configuration = {
      menus: {},
      spellingMistakes: {
        oldMistake1: "oldCorrection3",
        oldMistake2: "oldCorrection4",
      },
      possibleSenders: [],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      spellingMistakes: {
        oldMistake1: "oldCorrection3",
        oldMistake2: "oldCorrection4",
      },
      possibleSenders: [],
    });
  });

  test("correctly merges additive spelling mistakes from new and old configurations", () => {
    const oldConfig: Configuration = {
      menus: {},
      spellingMistakes: {
        oldMistake1: "oldCorrection1",
        oldMistake2: "oldCorrection2",
      },
      possibleSenders: [],
    };

    const newConfig: Configuration = {
      menus: {},
      spellingMistakes: {
        newMistake1: "newCorrection1",
        oldMistake2: "newCorrection2",
      },
      possibleSenders: [],
    };

    const result = mergeConfig(newConfig, oldConfig);

    expect(result).toEqual({
      menus: {},
      spellingMistakes: {
        newMistake1: "newCorrection1",
        oldMistake2: "newCorrection2",
      },
      possibleSenders: [],
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
      spellingMistakes: {},
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
      spellingMistakes: {},
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
      spellingMistakes: {},
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
      spellingMistakes: {},
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
      spellingMistakes: {},
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
      spellingMistakes: {},
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
