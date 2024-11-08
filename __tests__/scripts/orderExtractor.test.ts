import { describe, expect, test } from "vitest";
import { getOrderItemFromMessage } from "@/lib/utils";
import { Event } from "@/app/(master-layout)/event/[slug]/page";

const mockedEvent: Event = {
  name: "test event",
  slug: "test-event",
  enabled: true,
  maxOrders: 10,
  senders: ["test-sender"],
  pickupLocation: "test-location",
  welcomeMessage: "test-welcome-message",
  selection: {
    mode: "barista",
    items: [
      {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      {
        shortTitle: "Double Espresso",
        title: "Double Espresso",
        description: "Double shot of espresso",
      },
      {
        shortTitle: "Espresso",
        title: "Espresso",
        description: "Strong black coffee",
      },
      {
        shortTitle: "Flat White",
        title: "Flat White",
        description: "Espresso with velvety milk",
      },
      {
        shortTitle: "Macchiato",
        title: "Macchiato",
        description: 'Espresso "stained" with a splash of milk',
      },
      {
        shortTitle: "Double Macchiato",
        title: "Double Macchiato",
        description: "Two shots of espresso marked with milk",
      },
      {
        shortTitle: "Caffè Latte",
        title: "Caffè Latte",
        description: "Espresso with steamed milk",
      },
    ],
    modifiers: ["Milk", "Soy Milk", "Almond Milk", "Oat Milk", "Coconut Milk"],
  },
};

describe("Test if order extractor for items", async () => {
  test("should return a valid order item for a normal coffee order", async () => {
    const message = "I would like a coffee ";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      orderModifier: "",
    });
  });

  test("should return a valid order item for a long-titled order", async () => {
    const message = "Double Macchiato Two shots of espresso marked with milk";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Double Macchiato",
        title: "Double Macchiato",
        description: "Two shots of espresso marked with milk",
      },
      orderModifier: "Milk",
    });
  });

  test("should return a valid order item for a double espresso order", async () => {
    const message = "I would like a double espresso";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Double Espresso",
        title: "Double Espresso",
        description: "Double shot of espresso",
      },
      orderModifier: "",
    });
  });

  test("should return a valid order item for multiple items", async () => {
    const message = "I would like a double espresso and a coffee"; // only the first item is considered
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Double Espresso",
        title: "Double Espresso",
        description: "Double shot of espresso",
      },
      orderModifier: "",
    });
  });

  test("should return a empty order item for an invalid order", async () => {
    const message = "I would like a tea";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "",
        title: "",
        description: "",
      },
      orderModifier: "",
    });
  });

  test("should return a empty order item for an invalid order", async () => {
    const message = "how are you doing today?";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "",
        title: "",
        description: "",
      },
      orderModifier: "",
    });
  });
});

describe("Test if order extractor for modifiers", async () => {
  test("should return a valid order item for a coffee order with a regular modifier", async () => {
    const message = "I would like a coffee with milk";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      orderModifier: "Milk",
    });
  });

  test("should return a valid order item for a coffee order with a special modifier", async () => {
    const message = "I would like a coffee with soy milk";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      orderModifier: "Soy Milk",
    });
  });

  test("should return a valid order item for a coffee order with two modifiers", async () => {
    const message = "I would like a coffee with soy milk and oat milk";
    const result = await getOrderItemFromMessage(mockedEvent, message);
    expect(result).toEqual({
      orderItem: {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      orderModifier: "Soy Milk, Oat Milk",
    });
  });
});
