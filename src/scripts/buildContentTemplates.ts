export function getHelpPrivacyTemplate(
  numOptions: number,
  templateName: string,
): WhatsAppTemplateConfig {
  // The first variable defines the type of beverage abd then there are always 3 vars (short title, full title, desc) per options  => numOptions * 3

  const variables = Array.from(Array(numOptions * 3).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 1}}}`);
    items.push({
      item: `{{${i * 3 + 2}}}`,
      id: `{{${i * 3 + 2}}}`,
      description: `{{${i * 3 + 3}}}`,
    });
  }

  const body = `Welcome to the Twilio booth! Message the {{0}} you would like and we'll start preparing it. ${getAvailableOptions(indiciesOfFullTitles)}`;

  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

export function getWrongOrderTemplate(
  numOptions: number,
  templateName: string,
): WhatsAppTemplateConfig {
  // There's always var 0 and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = Array.from(Array(numOptions * 3 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 1}}}`);
    items.push({
      item: `{{${i * 3 + 2}}}`,
      id: `{{${i * 3 + 2}}}`,
      description: `{{${i * 3 + 3}}}`,
    });
  }

  const body = `Seems like your order of "{{0}}" is not something we can serve. ${getAvailableOptions(indiciesOfFullTitles)}\nWrite "I need help" to get an overview of other commands.`;

  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
      },
      "twilio/text": {
        body: body,
      },
    },
  };
}

const CONFIRMATION_VERIFIED_EMAIL = `Thank you! Your email address has been verified.`;
function getAvailableOptions(indiciesOfFullTitles: string[]) {
  return `What would you like? The options are:\n${indiciesOfFullTitles.join(
    "\n",
  )}`;
}
const SAMPLE_ORDER = `Or send a message containing your order, e.g. "{{1}}".`;
const ORDER_LIMITATION_NOTE = `\n\nPS: Every attendee can get up to {{0}}.`;
export function getReadyToOrderTemplate(
  numOptions: number,
  templateName: string,
): WhatsAppTemplateConfig {
  // The first two variables define the mode and the max num of orders and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = Array.from(Array(numOptions * 3 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `{{${i * 3 + 3}}}`,
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${CONFIRMATION_VERIFIED_EMAIL} ${getAvailableOptions(indiciesOfFullTitles)}\n${SAMPLE_ORDER}${ORDER_LIMITATION_NOTE}`;

  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
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
): WhatsAppTemplateConfig {
  // The first variable defines the mode and second is not used
  // and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = Array.from(Array(numOptions * 3 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `{{${i * 3 + 3}}}`,
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${CONFIRMATION_VERIFIED_EMAIL} ${getAvailableOptions(indiciesOfFullTitles)}\n${SAMPLE_ORDER}`;

  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
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
): WhatsAppTemplateConfig {
  // The first two variables define the mode and the max num of orders and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = Array.from(Array(numOptions * 3 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `{{${i * 3 + 3}}}`,
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getAvailableOptions(indiciesOfFullTitles)}\n${SAMPLE_ORDER}${ORDER_LIMITATION_NOTE}`;
  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
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
): WhatsAppTemplateConfig {
  // The first variable defines the mode and second is not used
  // and then 3 additional vars (short title, full title, desc) per options  => numOptions * 3 + 1

  const variables = Array.from(Array(numOptions * 3 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    items = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 3 + 2}}}`);
    items.push({
      item: `{{${i * 3 + 3}}}`,
      id: `{{${i * 3 + 3}}}`,
      description: `{{${i * 3 + 4}}}`,
    });
  }

  const body = `${getAvailableOptions(indiciesOfFullTitles)}\n${SAMPLE_ORDER}`;

  return {
    friendly_name: templateName,
    language: "en",
    variables,
    types: {
      "twilio/list-picker": {
        body,
        items,
        button: "More Details",
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
): WhatsAppTemplateConfig {
  const variables = Array.from(Array(numOptions * 2 + 1).keys()).reduce(
    (accu: any, idx) => {
      accu[idx] = "";
      return accu;
    },
    {},
  );

  const indiciesOfFullTitles = [],
    actions = [];
  for (let i = 0; i < numOptions; i++) {
    indiciesOfFullTitles.push(`- {{${i * 2}}}`);
    actions.push({
      title: `{{${i * 2}}}`,
      id: `{{${i * 2 + 1}}}`,
    });
  }

  const body = `Which event are you currently at? Please reply with the name of your event below. ${getAvailableOptions(indiciesOfFullTitles)}`;

  return {
    friendly_name: templateName,
    language: "en",
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
): WhatsAppTemplateConfig {
  const body =
    "Your {{0}} order (*#{{1}}*) has been cancelled. Please check with our staff if you think something is wrong.";

  return {
    friendly_name: templateName,
    language: "en",
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
): WhatsAppTemplateConfig {
  const body =
    "*Your {{0}} is ready*. You can skip the queue and collect it at {{2}} right away. Ask for order number #{{1}}.";

  return {
    friendly_name: templateName,
    language: "en",
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

export function getOrderReminderTemplate(
  templateName: string,
): WhatsAppTemplateConfig {
  const body =
    "Heya! Don't forget your {{0}}. You can skip the queue and collect it at {{2}}. Ask for order number #{{1}}.";

  return {
    friendly_name: templateName,
    language: "en",
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
  isBarista: boolean,
): WhatsAppTemplateConfig {
  const title = "Thanks for your order! Your {{0}} is confirmed under #{{1}}.";
  const body =
    'Your order\'s on track — ask for status or update.';

  const footer = isBarista
    ? "Thanks for ordering from the Twilio-powered Barista Bar!"
    : "Thanks for ordering from the Twilio-powered Smoothie Bar!";

  return {
    friendly_name: templateName,
    language: "en",
    variables: {
      "0": "order item",
      "1": "order number",
    },
    types: {
      "twilio/card": {
        title,
        subtitle: body,
        media: [
          "https://twilio-mixologist-645d3ffa8578.herokuapp.com/resources/twilio.mp4",
        ],
      },
      "twilio/text": {
        body: `${title}\n\n${body}`,
      },
    },
  };
}

export interface WhatsAppTemplateConfig {
  friendly_name: string;
  language: string;
  variables: Record<string, string>;
  types: {
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
      subtitle: string;
      media?: string[];
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
