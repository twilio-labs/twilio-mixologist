const axios = require("axios");
import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { modes } from "@/config/menus";

const { SERVICE_INSTANCE_PREFIX = "" } = process.env;

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function modeToBeverage(mode: modes, plural: boolean = false) {
  return mode === "smoothie" ? (plural ? "smoothies" : "smoothie") : "coffee";
}

async function getTemplates() {
  let templates: any[] = [];
  try {
    const { data } = await axios.get("https://content.twilio.com/v1/Content", {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: process.env.TWILIO_API_KEY,
        password: process.env.TWILIO_API_SECRET,
      },
    });

    templates = data.contents.filter((c: any) =>
      c.friendly_name.startsWith(SERVICE_INSTANCE_PREFIX.toLowerCase()),
    );
  } catch (err) {
    throw new Error("Failed to fetch Templates");
  }
  return templates;
}

export async function getWrongOrderMessage(
  originalMessage: string,
  availableOptions: any[],
) {
  const templates = await getTemplates();

  const variables = [
    originalMessage,
    ...availableOptions
      .map((o) => [o.title, o.shortTitle, o.description])
      .flat(),
  ];
  const contentVariables: any = {};
  variables.forEach((value, key) => {
    contentVariables[key] = value;
  });

  const templateName = `${SERVICE_INSTANCE_PREFIX.toLowerCase()}_wrong_order_${availableOptions.length}`;
  const template = templates.find((t) => t.friendly_name === templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }
  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };
}

export function getOrderCreatedMessage(
  product: string,
  orderNumber: number,
  event: Event,
) {
  const { mode } = event.selection;
  return `Thanks for ordering a *${product}* from the Twilio-powered ${capitalizeFirstLetter(mode)} Bar.\n\nYour order number is *#${orderNumber}*.\n\nWe'll text you back when the order is ready -- or send "queue" to determine your current position.\nSend  "change order to <new order>" to change your existing order or "cancel order" to cancel it.`;
}

export function getOrderCancelledMessage(product: string, orderNumber: string) {
  return `Your ${product} order has been cancelled. Please check with our staff if you think something is wrong. Your order number was #${orderNumber}.`;
}

export function getOrderReadyMessage(
  product: string,
  orderNumber: string,
  orderPickupLocation: string,
) {
  return `Your ${product} is ready. You can skip the queue and collect it at ${orderPickupLocation} right away. Ask for order number #${orderNumber}.`;
}

export function getOrderReadyReminderMessage(
  product: string,
  orderNumber: string,
  orderPickupLocation: string,
) {
  return `Heya! Don't forget your ${product}. You can skip the queue and collect it at ${orderPickupLocation}. Ask for order number #${orderNumber}.`;
}

export async function getHelpMessage(event: Event) {
  const templates = await getTemplates();

  const { mode, items: availableOptions } = event.selection;
  const variables = [
    modeToBeverage(mode, true),
    ...availableOptions
      .map((o) => [o.title, o.shortTitle, o.description])
      .flat(),
  ];
  const contentVariables: any = {};
  variables.forEach((value, key) => {
    contentVariables[key] = value;
  });

  const templateName = `${SERVICE_INSTANCE_PREFIX.toLowerCase()}_help_privacy_${availableOptions.length}`;
  const template = templates.find((t) => t.friendly_name === templateName);
  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };
}

export function getModifiersMessage(modifiers: string[]) {
  return `You can add the following add-ons to your order:\n${modifiers
    .map((m) => `- ${m}`)
    .join("\n")}`;
}

export function getExistingOrderMessage(product: string, orderNumber: number) {
  return `We're still making you a ${product}.\n\nIf you'd like to change or modify your order reply with 'Change order to {your new choice}'. \n\nCheck order #${orderNumber} with our staff if you think there's something wrong`;
}

export function getCancelOrderMessage(product: string, orderNumber: number) {
  return `Your order #${orderNumber} for ${product} has been cancelled successfully.`;
}

export function getNoOpenOrderMessage() {
  return "It seems like you have no open orders at the moment. Simply message us the name of the beverage you would like.";
}

export function getSystemOfflineMessage(event: Event) {
  const { mode } = event.selection;
  return `No more ${modeToBeverage(mode, true)} 😱\nIt seems like we are out of  ${modeToBeverage(mode, true)} for today. Have a great day!`;
}

export function getQueuePositionMessage(queuePosition: number) {
  return `There are currently ${queuePosition} orders before yours.`;
}

export function getOopsMessage(error: any) {
  return `Oops, something went wrong! Talk to someone from Twilio and see if they can help you.`;
}

export function getNoMediaHandlerMessage() {
  return "Sorry, we don't support media messages. Please send a text message to order a drink on us.";
}

export function getForgotAttendeeMessage() {
  return "Your data has been removed from our system and all pending orders were cancelled successfully. Please send another message to start over.";
}

export function getInvalidEmailMessage() {
  return "Invalid email address. Please reply with a valid business email address.";
}

export function getErrorDuringEmailVerificationMessage(error: string) {
  return `An error occurred during email verification: ${error}`;
}

export function getSentEmailMessage() {
  return "We have sent you an email with a verification code. Please reply with the code we sent to your email address.\nIf you did not receive the email, please check your spam folder or enter a new email address.";
}

export function getInvalidVerificationCodeMessage() {
  return "Invalid verification code. Please reply with the correct code.";
}

export function getWelcomeMessage(
  mode: modes,
  customWelcomeMessage?: string,
  willCollectedLeads?: boolean,
) {
  const welcomeMessage =
    customWelcomeMessage ||
    `Welcome at the Twilio Booth! Are you ready for a ${modeToBeverage(mode)} on us? 🎉`;
  const leadCollectionSuffix = willCollectedLeads
    ? "\nReply with your full name to get started."
    : "";
  return `${welcomeMessage}\n${leadCollectionSuffix}`;
}

export function getWelcomeBackMessage(
  mode: modes,
  event: string,
  customWelcomeMessage?: string,
) {
  const welcomeMessageSuffix =
    customWelcomeMessage ||
    `\nAre you ready for a ${modeToBeverage(mode)} on us?`;

  return `We're glad to see you again. You're now at ${event}.\n${welcomeMessageSuffix}`;
}

export async function getReadyToOrderMessage(
  event: Event,
  availableOptions: any[],
  maxNumberOrders: number,
  emailValidationSuffix: boolean,
) {
  const templates = await getTemplates();
  const { mode, items, modifiers } = event.selection;
  const maxOrders = `${maxNumberOrders} ${modeToBeverage(mode, true)}`;
  let sampleOrder = items[1].title;
  if (modifiers.length > 0) {
    sampleOrder += ` with ${modifiers[modifiers.length - 1]}`;
  }
  const variables = [
    maxOrders,
    sampleOrder,
    ...availableOptions
      .map((o) => [o.title, o.shortTitle, o.description])
      .flat(),
  ];
  const contentVariables: any = {};
  variables.forEach((value, key) => {
    contentVariables[key] = value;
  });

  const limitess = maxNumberOrders >= 50 ? "_limitless" : "";
  const emailSuffix = emailValidationSuffix ? "_without_email" : "";

  const templateName = `${SERVICE_INSTANCE_PREFIX.toLowerCase()}_ready_to_order${limitess}${emailSuffix}_${availableOptions.length}`;
  const template = templates.find((t) => t.friendly_name === templateName);

  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };
}

export function getDataPolicy(mode: string) {
  return `We only use your phone number to notify you about our ${mode} service and redact all the messages & phone numbers afterward.`;
}

export function getPromptForEmail(){
  return "Thanks. Please enter your business email address. We will then use Twilio Verify and SendGrid to send you an one-time password.";
}

export function getMaxOrdersMessage() {
  return "It seems like you've reached the maximum number of orders we allowed at this event. Sorry.";
}

export async function getEventRegistrationMessage(eventOptions: any[]) {
  const templates = await getTemplates();
  const variables = [
    ...eventOptions.map((o) => [o.data.name, o.data.name]).flat(),
  ];

  const contentVariables: any = {};
  variables.forEach((value, key) => {
    contentVariables[key] = value;
  });

  const templateName = `${SERVICE_INSTANCE_PREFIX.toLowerCase()}_event_registration_${eventOptions.length}`;
  const template = templates.find((t) => t.friendly_name === templateName);

  return {
    contentSid: template.sid,
    contentVariables: JSON.stringify(contentVariables),
  };
}

export function getNoActiveEventsMessage() {
  return "Oh no! 😕 It seems like we are not serving at the moment. Please check back later. 🙂";
}

export function getPausedEventMessage() {
  return "Hey there! We've paused orders for now. Please check back later.";
}

export function getChangedOrderMessage(
  orderNumber: number,
  newProduct: string,
) {
  return `Your order #${orderNumber} has been changed. \nWe'll now make you a ${newProduct}.`;
}
