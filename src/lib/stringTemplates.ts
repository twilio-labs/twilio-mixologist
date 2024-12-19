import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { modes } from "@/config/menus";

function modeToBeverage(mode: modes, plural: boolean = false) {
  return mode === "smoothie"
    ? plural
      ? "smoothies"
      : "smoothie"
    : mode === "cocktail"
      ? plural
        ? "drinks"
        : "drink"
      : "coffee";
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

export function getDataPolicy(mode: string) {
  return `We only use your phone number to notify you about our ${mode} service and redact all the messages & phone numbers afterward.`;
}

export function getPromptForEmail() {
  return "Thanks. Please enter your business email address. We will then use Twilio Verify and SendGrid to send you an one-time password.";
}

export function getMaxOrdersMessage() {
  return "It seems like you've reached the maximum number of orders we allowed at this event. Sorry.";
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
