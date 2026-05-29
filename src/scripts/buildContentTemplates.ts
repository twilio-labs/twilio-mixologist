import { Language } from "@/lib/stringTemplates";

const SAMPLE_ITEMS = [
  { title: "Espresso", shortTitle: "Espresso", description: "Rich Italian coffee" },
  { title: "Latte", shortTitle: "Latte", description: "Espresso with steamed milk" },
  { title: "Cappuccino", shortTitle: "Cappuccino", description: "Espresso with milk foam" },
  { title: "Americano", shortTitle: "Americano", description: "Espresso with hot water" },
  { title: "Flat White", shortTitle: "Flat White", description: "Espresso with microfoam" },
  { title: "Macchiato", shortTitle: "Macchiato", description: "Espresso with a dash of milk" },
  { title: "Cortado", shortTitle: "Cortado", description: "Espresso cut with warm milk" },
  { title: "Cold Brew", shortTitle: "Cold Brew", description: "Cold-steeped coffee" },
  { title: "Mocha", shortTitle: "Mocha", description: "Espresso with chocolate" },
  { title: "Ristretto", shortTitle: "Ristretto", description: "Short, concentrated espresso" },
];

// Builds sample variables for show_menu / show_help templates:
// {{0}} = intro, {{i*3+1}} = full title, {{i*3+2}} = short title, {{i*3+3}} = description, {{numOptions*3+1}} = outro
function buildShowMenuSampleVars(numOptions: number): Record<string, string> {
  const vars: Record<string, string> = { "0": "What would you like today?" };
  for (let i = 0; i < numOptions; i++) {
    const item = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
    vars[String(i * 3 + 1)] = item.title;
    vars[String(i * 3 + 2)] = item.shortTitle;
    vars[String(i * 3 + 3)] = item.description;
  }
  vars[String(numOptions * 3 + 1)] = "Reply with your choice!";
  return vars;
}

// Builds sample variables for ready_to_order templates:
// {{0}} = max orders, {{1}} = sample order, {{i*3+2}} = full title, {{i*3+3}} = short title, {{i*3+4}} = description
function buildReadyToOrderSampleVars(numOptions: number): Record<string, string> {
  const vars: Record<string, string> = { "0": "2 drinks", "1": "Espresso" };
  for (let i = 0; i < numOptions; i++) {
    const item = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
    vars[String(i * 3 + 2)] = item.title;
    vars[String(i * 3 + 3)] = item.shortTitle;
    vars[String(i * 3 + 4)] = item.description;
  }
  return vars;
}

// Builds sample variables for limitless ready_to_order templates (no {{0}} order-limit placeholder):
// {{1}} = sample order, {{i*3+2}} = full title, {{i*3+3}} = short title, {{i*3+4}} = description
function buildReadyToOrderLimitlessSampleVars(numOptions: number): Record<string, string> {
  const vars: Record<string, string> = { "1": "Espresso" };
  for (let i = 0; i < numOptions; i++) {
    const item = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
    vars[String(i * 3 + 2)] = item.title;
    vars[String(i * 3 + 3)] = item.shortTitle;
    vars[String(i * 3 + 4)] = item.description;
  }
  return vars;
}

// Builds sample variables for event_registration templates:
// {{i*2}} = event name, {{i*2+1}} = event id
function buildEventRegistrationSampleVars(numOptions: number): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < numOptions; i++) {
    vars[String(i * 2)] = `Event ${i + 1}`;
    vars[String(i * 2 + 1)] = `event-${i + 1}`;
  }
  return vars;
}

function getAvailableOptions(indiciesOfFullTitles: string[], language: Language) {
  if (language === "pt-BR") {
    return `O que você gostaria? As opções são:\n${indiciesOfFullTitles.join("\n")}`;
  }
  return `What would you like? The options are:\n${indiciesOfFullTitles.join("\n")}`;
}

function getConfirmationVerifiedEmail(language: Language) {
  return language === "pt-BR"
    ? `Obrigado! Seu endereço de e-mail foi verificado.`
    : `Thank you! Your email address has been verified.`;
}

function getSampleOrder(language: Language) {
  return language === "pt-BR"
    ? `Ou envie uma mensagem com o seu pedido, ex: "{{1}}".`
    : `Or send a message containing your order, e.g. "{{1}}".`;
}

function getOrderLimitationNote(language: Language) {
  return language === "pt-BR"
    ? `\n\nPS: Cada participante pode pedir até {{0}}.`
    : `\n\nPS: Every attendee can get up to {{0}}.`;
}

function getMoreDetailsButton(language: Language) {
  return language === "pt-BR" ? "Mais Detalhes" : "More Details";
}

export function getShowHelpTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  // The first variable defines the type of beverage abd then there are always 3 vars (short title, full title, desc) per options  => numOptions * 3

  const variables = buildShowMenuSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 1}}}`);
    items.push({
      item: `{{${i * 3 + 2}}}`,
      id: `Order a {{${i * 3 + 1}}}`, // should be same as indiciesOfFullTitles because this will be send to the webhook
      description: `{{${i * 3 + 3}}}`,
    });
  }

  const lastIndex = numOptions * 3 + 1;

  const body = `{{0}}\n${indiciesOfFullTitles.join("\n")}\n\n{{${lastIndex}}}`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: getMoreDetailsButton(language),
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getReadyToOrderTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  // The first two variables define the mode and the max num of orders and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = buildReadyToOrderSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `Order a {{${i * 3 + 2}}}`, // should be same as indiciesOfFullTitles because this will be send to the webhook
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getConfirmationVerifiedEmail(language)} ${getAvailableOptions(indiciesOfFullTitles, language)}\n${getSampleOrder(language)}${getOrderLimitationNote(language)}`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: getMoreDetailsButton(language),
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getReadyToOrderLimitlessTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const variables = buildReadyToOrderLimitlessSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `Order a {{${i * 3 + 2}}}`, // should be same as indiciesOfFullTitles because this will be send to the webhook
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getConfirmationVerifiedEmail(language)} ${getAvailableOptions(indiciesOfFullTitles, language)}\n${getSampleOrder(language)}`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: getMoreDetailsButton(language),
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getReadyToOrderWithoutEmailValidationTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  // The first two variables define the mode and the max num of orders and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = buildReadyToOrderSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `Order a {{${i * 3 + 2}}}`, // should be same as indiciesOfFullTitles because this will be send to the webhook
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getAvailableOptions(indiciesOfFullTitles, language)}\n${getSampleOrder(language)}${getOrderLimitationNote(language)}`;
  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: getMoreDetailsButton(language),
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getReadyToOrderLimitlessWithoutEmailValidationTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const variables = buildReadyToOrderLimitlessSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `Order a {{${i * 3 + 2}}}`, // should be same as indiciesOfFullTitles because this will be send to the webhook
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getAvailableOptions(indiciesOfFullTitles, language)}\n${getSampleOrder(language)}`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: getMoreDetailsButton(language),
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getEventRegistrationTemplate(
  numOptions: number,
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const variables = buildEventRegistrationSampleVars(numOptions);

  const indiciesOfFullTitles = [],
    actions = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 2}}}`);
    actions.push({
      title: `{{${i * 2}}}`,
      id: `{{${i * 2 + 1}}}`,
    });
  }

  const body = language === "pt-BR"
    ? `Em qual evento você está? Por favor, responda com o nome do seu evento abaixo. ${getAvailableOptions(indiciesOfFullTitles, language)}`
    : `Which event are you currently at? Please reply with the name of your event below. ${getAvailableOptions(indiciesOfFullTitles, language)}`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables,
    types: {
      "twilio/quick-reply": {
        body,
        actions,
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getOrderCancelledTemplate(
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const body = language === "pt-BR"
    ? "Seu pedido de {{0}} (*#{{1}}*) foi cancelado. Por favor, fale com nossa equipe se achar que algo está errado."
    : "Your {{0}} order (*#{{1}}*) has been cancelled. Please check with our staff if you think something is wrong.";

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables: {
      "0": "order item",
      "1": "order number",
    },
    types: {
      "twilio/text": {
        body,
      },
    },
  };
}

export function getOrderReadyTemplate(
  templateName: string,
  baseUrl: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const cardBody = language === "pt-BR"
    ? "Pule a fila e retire seu {{0}} no {{2}}. \n\nPeça pelo número do pedido #{{1}} ao retirar."
    : "Skip the line and collect your {{0}} at the {{2}}. \n\nAsk for order number #{{1}} when you pick it up.";

  const cardTitle = language === "pt-BR"
    ? "Pule a fila e retire seu {{0}} no {{2}}."
    : "Skip the line and collect your {{0}} at the {{2}}.";

  const cardBodyShort = language === "pt-BR"
    ? "Peça pelo número do pedido #{{1}} ao retirar."
    : "Ask for order number #{{1}} when you pick it up.";

  const textBody = language === "pt-BR"
    ? "Seu {{0}} está pronto. \n\nPule a fila e retire agora no {{2}}. \n\nPeça pelo número do pedido #{{1}} ao retirar."
    : "Your {{0}} is ready. \n\nSkip the line and collect it at the {{2}} right away. \n\nAsk for order number #{{1}} when you pick it up.";

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables: {
      "0": "order item",
      "1": "order number",
      "2": "order pickup location",
    },
    types: {
      "whatsapp/card": {
        actions: [],
        body: cardBody,
        media: [
          `${baseUrl}/rcs-resources/ready.png`,
        ],
      },
      "twilio/card": {
        media: [`${baseUrl}/rcs-resources/ready.png`],
        orientation: "VERTICAL",
        title: cardTitle,
        body: cardBodyShort,
      },
      "twilio/text": {
        body: textBody,
      },
    },
  };
}

export function getOrderReminderTemplate(
  templateName: string,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const body = language === "pt-BR"
    ? "Ei! Não esqueça seu {{0}}. Você pode pular a fila e retirá-lo em {{2}}. \n\nPeça pelo número do pedido #{{1}} ao retirar."
    : "Heya! Don't forget your {{0}}. You can skip the queue and collect it at {{2}}. \n\nAsk for order number #{{1}} when you pick it up.";

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables: {
      "0": "order item",
      "1": "order number",
      "2": "order pickup location",
    },
    types: {
      "twilio/text": {
        body,
      },
    },
  };
}

export function getOrderConfirmationTemplate(
  templateName: string,
  _isBarista: boolean,
  language: Language = "en",
): WhatsAppTemplateConfig {
  const header_text = language === "pt-BR"
    ? "Seu pedido de {{0}} está confirmado!"
    : "Your {{0}} order is confirmed!";

  const body = language === "pt-BR"
    ? `*Seu número de pedido é #{{1}}*\n\nVamos te avisar quando o pedido estiver pronto — ou envie "fila" para ver sua posição atual\n\nEnvie "alterar pedido para <novo pedido>" para alterar seu pedido ou "cancelar pedido" para cancelá-lo.`
    : `*Your order number is #{{1}}*\n\nWe'll text you back when the order is ready -- or send "queue" to determine your current position\n\nSend  "change order to <new order>" to change your existing order or "cancel order" to cancel it.`;

  return {
    friendly_name: templateName,
    language: language === "pt-BR" ? "pt_BR" : "en",
    variables: {
      "0": "order item",
      "1": "order number",
    },
    types: {
      "twilio/text": {
        body: `${header_text}\n\n${body}`,
      },
    },
  };
}

export interface WhatsAppTemplateConfig {
  friendly_name: string;
  language: string;
  variables: Record<string, string>;
  types: {
    "whatsapp/card"?: {
      body: string;
      footer?: string;
      header_text?: string;
      media?: string[];
      actions?: Array<{
        type: "url" | "postback";
        text: string;
        url?: string;
        postback_data?: string;
      }>;
    };
    "twilio/list-picker"?: {
      body: string;
      items: Array<{
        item: string;
        id: string;
        description: string;
      }>;
      button: string;
    };
    "twilio/text": {
      body: string;
    };
    "twilio/quick-reply"?: {
      body: string;
      actions: Array<{
        title: string;
        id: string;
      }>;
    };
    "twilio/card"?: {
      title?: string;
      media?: string[];
      body: string;
      orientation?: "HORIZONTAL" | "VERTICAL";
    };
  };
  links?: {
    approval_fetch: string;
    approval_create: string;
  };
}

export interface WhatsAppTemplate extends WhatsAppTemplateConfig {
  date_updated: string;
  account_sid: string;
  url: string;
  sid: string;
  date_created: string;
  links: {
    approval_fetch: string;
    approval_create: string;
  };
}
