import { expect, type FullConfig } from "@playwright/test";
import Axios from "axios";

async function deleteIfExists(baseURL: string) {
  try {
    await Axios.delete(`${baseURL}/api/event/test-event`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      },
    });
  } catch (e) {}
}

async function createEvent(baseURL: string) {
  return Axios.post(
    `${baseURL}/api/event`,
    {
      name: "TestEvent",
      slug: "test-event",
      state: "OPEN",
      senders: ["+4915199999999", "whatsapp:+447700161860"],
      selection: {
        items: [
          {
            title: "Espresso",
            shortTitle: "Espresso",
            description: "Strong black coffee",
          },
        ],
        modifiers: [],
        mode: "barista",
      },
      pickupLocation: "Pickup location",
      maxOrders: 1860,
      welcomeMessage: "Custom Welcome",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      },
    },
  );
}

async function createOrder(
  baseURL: string,
  status: string,
  originalText: string,
) {
  return Axios.post(
    `${baseURL}/api/order`,
    {
      event: "test-event",
      order: {
        status,
        item: "Espresso",
        key: "test-order",
        address: "+123***123",
        originalText,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(process.env.ADMIN_LOGIN || ":")}`,
      },
    },
  );
}

async function globalSetup(config: FullConfig) {
  const baseURL = config?.webServer?.url || "http://localhost:3000";

  await deleteIfExists(baseURL);
  const response = await createEvent(baseURL);
  expect(response.status).toBe(201);

  const cancelledOrder = await createOrder(
    baseURL,
    "cancelled",
    "A Cancelled Order",
  );
  expect(cancelledOrder.status).toBe(201);

  const deliveredOrder = await createOrder(
    baseURL,
    "delivered",
    "A Delivered Order",
  );
  expect(deliveredOrder.status).toBe(201);

  for (let i = 0; i < 2; i++) {
    const espressoOrder = await createOrder(baseURL, "queued", "firefox");
    expect(espressoOrder.status).toBe(201);
  }
  for (let i = 0; i < 4; i++) {
    const espressoOrder = await createOrder(baseURL, "queued", "chromium");
    expect(espressoOrder.status).toBe(201);
  }
  for (let i = 0; i < 4; i++) {
    const espressoOrder = await createOrder(baseURL, "queued", "webkit");
    expect(espressoOrder.status).toBe(201);
  }

  for (let i = 0; i < 50; i++) {
    const espressoOrder = await createOrder(baseURL, "queued", "A test order");
    expect(espressoOrder.status).toBe(201);
  }
}

export default globalSetup;
