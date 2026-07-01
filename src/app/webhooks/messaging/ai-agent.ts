// Copyright (c) 2025 Twilio Inc.

"use server";

import OpenAI from "openai";
import {
  createSyncMapItemIfNotExists,
  fetchSyncListItems,
  updateSyncMapItem,
  updateOrCreateSyncMapItem,
  sendMessage,
} from "@/lib/twilio";
import {
  addOrder,
  cancelOrder,
  fetchOrder,
  updateOrder,
  verifyOrder,
} from "../mixologist-helper";
import { getReadyToOrderMessage } from "@/scripts/fetchContentTemplates";
import { redact, Stages, TwoWeeksInSeconds } from "@/lib/utils";
import type { Event, Order } from "@/types";

const NEXT_PUBLIC_ATTENDEES_MAP =
  process.env.NEXT_PUBLIC_ATTENDEES_MAP || "";
const UNLIMITED_ORDERS = (process.env.UNLIMITED_ORDERS || "").split(",");

// Prompt injection guard — block attempts to override the system role
const INJECTION_PATTERNS = [
  /ignore (all |previous |prior |above |the |your )?(instructions?|prompts?|rules?|guidelines?|system)/i,
  /you are now/i,
  /new (role|persona|instructions?|system prompt)/i,
  /\[system\]/i,
  /act as (an? )?(different|unrestricted|unfiltered|jailbreak)/i,
  /disregard (your|all|any)/i,
  /forget (everything|all|your|previous)/i,
];

function isInjectionAttempt(message: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(message));
}

async function getQueuePosition(eventSlug: string, orderIndex: number): Promise<number | null> {
  const items = await fetchSyncListItems(eventSlug);
  const openOrders = items.filter((item) => (item.data as any).status === "queued");
  const pos = openOrders.findIndex((item) => item.index === orderIndex);
  return pos >= 0 ? pos : null;
}

// Tool implementations — called when the model invokes a tool
async function toolPlaceOrder(
  args: { item: string; modifiers?: string[]; original_message: string },
  event: Event,
  phone: string,
  sender: string,
): Promise<string> {
  const { item, modifiers = [], original_message } = args;

  if (!verifyOrder(item, event, modifiers)) {
    return `"${item}" is not on the menu. Valid items: ${event.selection.items.map((i) => i.title).join(", ")}.`;
  }

  const { data: record } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );

  const lastOrder = await fetchOrder(event.slug, (record as any)?.lastOrderNumber);
  if ((lastOrder?.data as any)?.status === "queued") {
    return `You already have an active order (#${lastOrder!.index}) for a ${(lastOrder!.data as any).item}. Cancel or modify it first.`;
  }

  const today = new Date().toISOString().split("T")[0];
  const isNewDay = (record as any)?.dailyOrderDate !== today;
  const dailyCount = isNewDay ? 0 : Number((record as any)?.dailyOrderCount ?? 0);
  if (dailyCount >= event.maxOrders && !UNLIMITED_ORDERS.includes(phone)) {
    return `You've reached the daily limit of ${event.maxOrders} orders.`;
  }

  const channel = sender.startsWith("whatsapp:") ? "whatsapp"
    : sender.startsWith("rcs:") ? "rcs"
    : "sms";

  const order: Order = {
    key: phone,
    address: await redact(sender),
    item,
    ...(modifiers.length > 0 && { modifiers: modifiers.join(", ") }),
    originalText: original_message,
    status: "queued",
    channel,
  };

  const orderNumber = await addOrder(event.slug, order);
  const orderCount = Number((record as any)?.orderCount ?? 0) + 1;

  await updateSyncMapItem(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
    {
      event: event.slug,
      lastOrderNumber: orderNumber,
      orderCount,
      dailyOrderCount: dailyCount + 1,
      dailyOrderDate: today,
      stage: orderCount === 1 ? Stages.FIRST_ORDER : Stages.REPEAT_CUSTOMER,
    },
    TwoWeeksInSeconds,
  );

  return `Order #${orderNumber} for a ${item}${modifiers.length > 0 ? ` with ${modifiers.join(", ")}` : ""} placed successfully.`;
}

async function toolEditOrder(
  args: { action: "edit" | "cancel"; item: string; modifiers?: string[]; original_message: string },
  event: Event,
  phone: string,
): Promise<string> {
  const { action, item, modifiers = [], original_message } = args;

  const { data: record } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );
  const lastOrder = await fetchOrder(event.slug, (record as any)?.lastOrderNumber);

  if (!lastOrder || (lastOrder.data as any)?.status !== "queued") {
    return action === "cancel" ? "No active order to cancel." : "No active order to edit.";
  }

  if (action === "cancel") {
    await cancelOrder(event, lastOrder.index, lastOrder.data as Order);
    return `Order #${lastOrder.index} cancelled.`;
  }

  if (!verifyOrder(item, event, modifiers)) {
    return `"${item}" is not a valid menu item.`;
  }

  await updateOrder(event.slug, lastOrder.index, {
    ...(lastOrder.data as Order),
    item,
    ...(modifiers.length > 0 && { modifiers: modifiers.join(", ") }),
    originalText: original_message,
    status: "queued",
  });

  return `Order #${lastOrder.index} updated to ${item}${modifiers.length > 0 ? ` with ${modifiers.join(", ")}` : ""}.`;
}

async function toolShowMenu(event: Event, sender: string): Promise<string> {
  const language = event.language ?? "en";
  const message = await getReadyToOrderMessage(
    event,
    event.selection.items,
    event.maxOrders,
    false,
    language,
  );
  sendMessage(sender, "", message.contentSid, message.contentVariables);
  return "Menu sent to the user.";
}

async function toolGetOrderStatus(event: Event, phone: string): Promise<string> {
  const { data: record } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );
  const lastOrderNumber = (record as any)?.lastOrderNumber as number;
  const lastOrder = await fetchOrder(event.slug, lastOrderNumber);

  if (!lastOrder) return "No orders found.";

  const status = (lastOrder.data as any)?.status;
  if (status !== "queued") {
    return `Your last order (#${lastOrder.index}) for a ${(lastOrder.data as any).item} has status: ${status}.`;
  }

  const pos = await getQueuePosition(event.slug, lastOrder.index);
  return pos !== null
    ? `Your order (#${lastOrder.index}) for a ${(lastOrder.data as any).item} is queued at position ${pos}.`
    : `Your order (#${lastOrder.index}) for a ${(lastOrder.data as any).item} is being prepared.`;
}

export async function runAiAgent(
  message: string,
  event: Event,
  phone: string,
  sender: string,
): Promise<string | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set");
    return null;
  }

  if (isInjectionAttempt(message)) {
    return "I can only help you order, modify, or cancel a drink. What would you like?";
  }

  // Fetch conversation record — history stored as [{role, content}] in Sync
  const { data: syncRecord } = await createSyncMapItemIfNotExists(
    NEXT_PUBLIC_ATTENDEES_MAP,
    phone,
  );
  const history: Array<{ role: "user" | "assistant"; content: string }> =
    (syncRecord as any)?.aiHistory ?? [];

  const menuList = event.selection.items.map((i) => `'${i.title}'`).join(" | ");
  const menuDetails = event.selection.items
    .map((i) => `- ${i.title}${i.description ? `: ${i.description}` : ""}`)
    .join("\n");
  const modifierList = event.selection.modifiers.length > 0
    ? event.selection.modifiers.map((m) => `'${m}'`).join(", ")
    : "none";
  const systemPrompt = `You are a helpful barista that accepts ${event.selection.mode} orders. This is a marketing activation from Twilio used at a conference. You are free to tell the customers basic facts about Twilio but defer to the Twilio employees (Twilions) at the event if the customers have detailed questions.

Menu:
${menuDetails}

Available add-ons: ${modifierList}
Max orders per day: ${event.maxOrders}

Rules:
* Only help with drink orders and related tasks. Politely decline any other topics.
* Use the item descriptions to make personalised suggestions when the user asks for a recommendation or describes what they feel like.
* NEVER GIVE MORE THAN 5 SUGGESTIONS AT A TIME. If the user wants more, they can ask for more.
* Always use the exact item title (not the description) when calling tools.
* Never add new menu items or modifier options that are not listed above.
* If the user doesn't specify a modifier, don't ask for it — assume they don't want one.
* If the user's message is ambiguous, ask one short clarifying question.
* If the user wants to order, first call the appropriate tool. Once the tool returns a success message, confirm the order number and let them know they will be notified when it is ready.
* If the order tool returns a non-200 / error response, reply: "Your order could not be placed. It is possible the maximum number of drinks allowed today has been reached or that your previous order is still being processed. Please try again in a bit or ask a Twilion for help."
* Always reply in the same language the user used in their previous message (if they wrote more than 6 words in that language).
* When suggesting menu items, ALWAYS format them as a markdown list.
* Never fabricate information on tool execution failures. Acknowledge errors without speculation.
* If the users want to learn more about Twilio, point them to the Twilio employees at the booth.
* If they want to reach out to sales, point them to https://www.twilio.com/en-us/help/sales
* UNDER NO CIRCUMSTANCES TALK ABOUT TWILIO COMPETITORS. If asked, say you can't help with that and suggest they ask a Twilion.
* Use the log_feedback tool if the user asks for something you cannot do. This stores their attempted action so we can improve the system.`;

  const tools: OpenAI.Responses.FunctionTool[] = [
    {
      type: "function",
      name: "place_order",
      description: `Submit a sanitized order to the barista.
* Always include the original user message as original_message for sanity checks.
* If the requested item or modifier is not on the menu, do not submit — tell the user and suggest an alternative.
* On success, confirm the order number and tell the user they will be notified when it is ready.
* On error, use the response template from the system prompt.`,
      strict: true,
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: `Exact menu item title. Must be one of: ${menuList}` },
          modifiers: { type: "array", items: { type: "string" }, description: `Optional add-ons. Valid values: ${modifierList}` },
          original_message: { type: "string", description: "The user's original message verbatim" },
        },
        required: ["item", "modifiers", "original_message"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "edit_order",
      description: `Edit or cancel the attendee's current queued order.
* Use action "edit" to change the item/modifiers, "cancel" to remove the order.
* For "cancel", item and modifiers are not required.
* Always include the most recent user message as original_message.
* We call them "modifiers" internally — when talking to the user you can say "options" or "extras", but never change the term when calling the tool.
* On success, confirm the updated order number. On error, explain what failed.`,
      strict: true,
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["edit", "cancel"] },
          item: { type: "string", description: `Exact menu item title. Must be one of: ${menuList}` },
          modifiers: { type: "array", items: { type: "string" } },
          original_message: { type: "string" },
        },
        required: ["action", "item", "modifiers", "original_message"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "get_order_status",
      description: "Get the status and queue position of the attendee's current order.",
      strict: true,
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
    {
      type: "function",
      name: "show_menu",
      description: "Send the full menu to the user as a formatted message. Call this when the user asks to see the menu.",
      strict: true,
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
    {
      type: "function",
      name: "log_feedback",
      description: "Call this whenever the user asks for something you cannot do or that is outside the scope of this event. Tell the user politely you cannot help, then call this tool to record the attempted action for future improvements.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          attempted_action: { type: "string", description: "Brief description of what the user tried to do" },
        },
        required: ["attempted_action"],
        additionalProperties: false,
      },
    },
  ];

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Build input: prior history + new user message
  const input: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history,
    { role: "user", content: message },
  ];

  let response = await client.responses.create({
    model: "gpt-4o-mini",
    instructions: systemPrompt,
    input: input as any,
    tools,
  });

  // Agentic loop — execute tool calls until the model produces a final text response
  while (response.output.some((o) => o.type === "function_call")) {
    const toolResults: OpenAI.Responses.ResponseInputItem.FunctionCallOutput[] = [];

    for (const output of response.output) {
      if (output.type !== "function_call") continue;

      let result: string;
      try {
        const args = JSON.parse(output.arguments);
        switch (output.name) {
          case "place_order":
            result = await toolPlaceOrder(args, event, phone, sender);
            break;
          case "edit_order":
            result = await toolEditOrder(args, event, phone);
            break;
          case "get_order_status":
            result = await toolGetOrderStatus(event, phone);
            break;
          case "show_menu":
            result = await toolShowMenu(event, sender);
            break;
          case "log_feedback":
            console.log(`[feedback] ${phone}: ${args.attempted_action}`);
            result = "Feedback logged.";
            break;
          default:
            result = "Unknown tool.";
        }
      } catch (e: any) {
        result = `Tool error: ${e.message}`;
      }

      toolResults.push({ type: "function_call_output", call_id: output.call_id, output: result });
    }

    response = await client.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input: [
        ...input,
        ...response.output,
        ...toolResults,
      ] as any,
      tools,
    });
  }

  // Extract the assistant's reply
  const textOutput = response.output.find((o) => o.type === "message");
  if (!textOutput || textOutput.type !== "message") return null;
  const content = textOutput.content.find((c) => c.type === "output_text");
  const reply = content?.type === "output_text" ? content.text : null;

  // Persist updated history (cap at 20 turns to stay within Sync item size limits)
  if (reply) {
    const updatedHistory = [
      ...history,
      { role: "user" as const, content: message },
      { role: "assistant" as const, content: reply },
    ].slice(-20);

    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      { aiHistory: updatedHistory },
      TwoWeeksInSeconds,
    );
  }

  return reply;
}
