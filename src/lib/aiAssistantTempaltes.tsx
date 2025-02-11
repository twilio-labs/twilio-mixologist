import { MenuItem } from "@/config/menus";

export function getSystemPrompt(mode: string) {
  return `You are a helpful barista that accepts ${mode} orders. 
  Note, only help with the coffee orders and related tasks. You can also share the menu available with the user. However, don't add new menu items or options for modifiers on your own.
  * Never fabricate information on tool execution failures
  * Acknowledge errors without speculation
  * Always reply in the language the user used in the previous message
  * If the user doesn't specify a modifier, don't ask for it and just assume they don't want one.
  * If the user want to order a coffee, first call the appropriate tool. Once the tool returns a success message, let the user know that the order has been accepted.
  * Also, when you you suggest menu items to the user, format them ALWAYS as a markdown list.`;
}

export function getSubmitOrdersTool(
  callbackUrl: string,
  items: MenuItem[],
  modifiers?: string[],
) {
  const listOfItems = items.map((item) => `'${item.title}'`).join(" | ");
  const listOfModfiers = modifiers
    ? `modifiers: (${modifiers.map((modifier) => `'${modifier}'`).join(" | ")})[];`
    : "";
  return {
    name: "Submit Order",
    description: `Use this to submit sanitized orders for a barista. A user can only order one item at a time. So it doesn't make sense to send multiple items in one message. The user can only submit another order after the previous one has been prepared or canceled.
      * Always return the originalMessage back for sanity checks
      * If the order has been placed successfully, let the user know that the order is being prepared and don't forget to tell them their order number for reference. Also, it's important to let them know they will be notified when the order is ready.
      * If the tool returns a non-200 response, it means the order failed. You must let the user know why it failed, the reason is returned with the error code.`,
    type: "WEBHOOK",
    enabled: true,
    meta: {
      input_schema: `export type Data = { originalMessage: string; item: ${listOfItems}; ${listOfModfiers} }; `,
      method: "POST",
      url: callbackUrl,
    },
  };
}

export function getEditOrderTool(
  callbackUrl: string,
  items: MenuItem[],
  modifiers?: string[],
) {
  const listOfItems = items.map((item) => `'${item.title}'`).join(" | ");
  const listOfModfiers = modifiers
    ? `modifiers: (${modifiers.map((modifier) => `'${modifier}'`).join(" | ")})[];`
    : "";
  return {
    name: "Edit / Cancel Order",
    description: `Use this to edit sanitized orders for a barista. 
      * The tool can be used to replace an existing order or the cancel an existing order. The property "action" decides which action to take.
      * Always return the most recent message as "originalMessage" back for sanity checks
      * If the order has been changed successfully, let the user know that the order is being prepared and tell them their order number
      * In case of "cancel", the "originalMessage", "item", and "modifiers" properties are not required.
      * If the tool returns a non-200 response, it means the edit order failed. Let the user know why it failed.`,
    type: "WEBHOOK",
    enabled: true,
    meta: {
      input_schema: `export type Data = {  action: 'cancel' | 'edit' ; originalMessage:string, item: ${listOfItems}; ${listOfModfiers} };`,
      method: "POST",
      url: callbackUrl,
    },
  };
}

export function getFetchOrderInfoTool(callbackUrl: string) {
  return {
    name: "Fetch Order Info",
    description: `Use this to fetch order information for a barista. 
      The tool returns the the item and modifiers of the order. Additionally, it returns how many other orders are in the queue before this order.
      The tool  If the tool returns a non-200 response, it means the fetch order info failed. Let the user know why it failed.`,
    type: "WEBHOOK",
    enabled: true,
    meta: {
      input_schema: `export type Data = { };`,
      method: "GET",
      url: callbackUrl,
    },
  };
}

export function getForgetUserTool(callbackUrl: string) {
  return {
    name: "Remove User Profile",
    description: `Use this to delete the data of a user. Only call this if the user indicated they want their data to be removed. There's no need to send a confirmation message. Only send one if the tool fails with an error / non-200 response.`,
    type: "WEBHOOK",
    enabled: true,
    meta: {
      input_schema: `export type Data = { };`,
      method: "POST",
      url: callbackUrl,
    },
  };
}

export function getShowMenuTool() {
  return {
    name: "show_menu_items",
    description: "Send a special message to show all menu items to the user.",
    strict: true,
    parameters: {
      type: "object",
      required: ["menu_items"],
      properties: {
        menu_items: {
          type: "array",
          description: "Array of all menu items",
          items: {
            type: "object",
            required: ["shortName", "longName", "description"],
            properties: {
              shortName: {
                type: "string",
                description: "Short name of the menu item",
              },
              longName: {
                type: "string",
                description: "Long name of the menu item",
              },
              description: {
                type: "string",
                description: "Description of the menu item",
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  };
}
