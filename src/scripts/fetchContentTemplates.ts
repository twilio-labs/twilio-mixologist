"use server";

import { modes } from "@/config/menus";
import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { Language } from "@/lib/stringTemplates";

const axios = require("axios");

const { SERVICE_INSTANCE_PREFIX = "" } = process.env;
const formattedServicePrefix = SERVICE_INSTANCE_PREFIX.toLowerCase();

const LANG_SUFFIX: Record<Language, string> = { "en": "", "pt-BR": "_ptbr" };

function modeToBeverage(mode: modes, language: Language, plural: boolean = false) {
  if (language === "pt-BR") {
    return mode === "smoothie"
      ? plural ? "smoothies" : "smoothie"
      : mode === "cocktail"
        ? plural ? "bebidas" : "bebida"
        : mode === "tea"
          ? plural ? "chás" : "chá"
          : mode === "waffles"
            ? plural ? "waffles" : "waffle"
          : plural ? "cafés" : "café";
  }
  return mode === "smoothie"
    ? plural ? "smoothies" : "smoothie"
    : mode === "cocktail"
      ? plural ? "drinks" : "drink"
      : mode === "tea"
        ? plural ? "teas" : "tea"
        : mode === "waffles"
          ? plural ? "waffles" : "waffle"
        : "coffee";
}

function buildContentVariables(variables: any[], startIndex = 0) {
  const contentVariables: any = {};
  variables.forEach((value, i) => {
    contentVariables[String(i + startIndex)] = value;
  });
  return JSON.stringify(contentVariables);
}

async function getTemplate(templateName: string) {
  let match, nextPageUrl;
  try {
    do {
      const { data }: { data: any } = await axios.get(
        nextPageUrl || "https://content.twilio.com/v1/Content?PageSize=50",
        {
          headers: {
            "Content-Type": "application/json",
          },
          auth: {
            username: process.env.TWILIO_API_KEY,
            password: process.env.TWILIO_API_SECRET,
          },
        },
      );
      match = data.contents.find((t: any) => t.friendly_name === templateName);
      nextPageUrl = data.meta.next_page_url;
    } while (!match && nextPageUrl);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch Templates");
  }
  if (!match) {
    throw new Error(`Template ${templateName} not found`);
  }
  return match;
}

export async function getWrongOrderMessage(
  originalMessage: string,
  availableOptions: any[],
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_wrong_order_${availableOptions.length}${suffix}`,
  );

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      originalMessage,
      ...availableOptions
        .map((o) => [o.title, o.shortTitle, o.description])
        .flat(),
    ]),
  };
}

export async function getOrderCancelledMessage(
  product: string,
  orderNumber: string,
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_order_cancelled${suffix}`,
  );

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([product, orderNumber]),
  };
}

export async function getOrderReadyMessage(
  product: string,
  orderNumber: string,
  orderPickupLocation: string,
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(`${formattedServicePrefix}_order_ready${suffix}`);

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      product,
      orderNumber,
      orderPickupLocation,
    ]),
  };
}

export async function getOrderReadyReminderMessage(
  product: string,
  orderNumber: string,
  orderPickupLocation: string,
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_order_reminder${suffix}`,
  );

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      product,
      orderNumber,
      orderPickupLocation,
    ]),
  };
}

export async function getShowMenuMessage(
  intro: string,
  availableOptions: any[],
  outro: string,
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_show_menu_${availableOptions.length}${suffix}`,
  );
  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      intro,
      ...availableOptions
        .map((o) => [o.title, o.shortTitle, o.description])
        .flat(),
      outro,
    ]),
  };
}

export async function getShowModifiersMessage(
  intro: string,
  availableModifiers: string[],
  outro: string,
  language: Language = "en",
) {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_show_menu_${availableModifiers.length}${suffix}`,
  );
  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      intro,
      ...availableModifiers.map((o) => [o, o, o]).flat(),
      outro,
    ]),
  };
}

export async function getReadyToOrderMessage(
  event: Event,
  availableOptions: any[],
  maxNumberOrders: number,
  emailValidationSuffix: boolean,
  language: Language = "en",
) {
  const { mode, items, modifiers } = event.selection;
  const maxOrders = `${maxNumberOrders} ${modeToBeverage(mode, language, true)}`;
  let sampleOrder = items[1].title;
  if (modifiers.length > 0) {
    sampleOrder += ` with ${modifiers[modifiers.length - 1]}`;
  }

  const limitess = maxNumberOrders >= 50 ? "_limitless" : "";
  const emailSuffix = emailValidationSuffix ? "_without_email" : "";
  const langSuffix = LANG_SUFFIX[language];

  const template = await getTemplate(
    `${formattedServicePrefix}_ready_to_order${limitess}${emailSuffix}_${availableOptions.length}${langSuffix}`,
  );

  const isLimitless = maxNumberOrders >= 50;

  if (isLimitless) {
    return {
      contentSid: template.sid,
      contentVariables: buildContentVariables(
        [
          sampleOrder,
          ...availableOptions
            .map((o) => [o.title, o.shortTitle, o.description])
            .flat(),
        ],
        1,
      ),
    };
  }

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      maxOrders,
      sampleOrder,
      ...availableOptions
        .map((o) => [o.title, o.shortTitle, o.description])
        .flat(),
    ]),
  };
}

export async function getEventRegistrationMessage(eventOptions: any[], language: Language = "en") {
  const suffix = LANG_SUFFIX[language];
  const template = await getTemplate(
    `${formattedServicePrefix}_event_registration_${eventOptions.length}${suffix}`,
  );

  return {
    contentSid: template.sid,
    contentVariables: buildContentVariables([
      ...eventOptions.map((o) => [o.data.name, o.data.name]).flat(),
    ]),
  };
}
