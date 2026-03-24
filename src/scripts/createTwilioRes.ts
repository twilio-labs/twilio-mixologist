import {
  createServiceInstances,
  deleteWhatsAppTemplate,
  getAllWhatsAppTemplates,
  createWhatsAppTemplate,
} from "@/lib/twilio";
import nextConfig from "../../next.config";
import {
  getEventRegistrationTemplate,
  getOrderCancelledTemplate,
  getOrderConfirmationTemplate,
  getOrderReadyTemplate,
  getOrderReminderTemplate,
  getReadyToOrderLimitlessTemplate,
  getReadyToOrderLimitlessWithoutEmailValidationTemplate,
  getReadyToOrderTemplate,
  getReadyToOrderWithoutEmailValidationTemplate,
  getShowHelpTemplate,
  WhatsAppTemplate,
} from "./buildContentTemplates";
import { Language } from "@/lib/stringTemplates";

// this script runs mostly sequentially. Use a throttled queue later to optimize if needed

const CONTENT_PREFIX = nextConfig?.env?.CONTENT_PREFIX;

let { PUBLIC_BASE_URL = "", OVERRIDE_TEMPLATES } = process.env;

const LANGUAGES: Language[] = ["en", "pt-BR"];
const LANG_SUFFIX: Record<Language, string> = { "en": "", "pt-BR": "_ptbr" };

(async () => {
  await createServiceInstances();
  await createWhatsAppTemplates();
})();

async function checkIfExistsOrCreateTemplate(
  templateName: string,
  rawTemplate: any,
  allTemplates: WhatsAppTemplate[],
) {
  if (allTemplates.find((c) => c.friendly_name === templateName)) {
    console.log(
      `Skip creating Template because "${templateName}" already exists`,
    );
  } else {
    const template = await createWhatsAppTemplate(rawTemplate);
    console.log(`Created Template "${templateName}" ${template.sid}`);
  }
}

async function createWhatsAppTemplates() {
  if (!CONTENT_PREFIX) {
    throw new Error("CONTENT_PREFIX is not set in the environment variables");
  }

  let templateName: string;
  const MAX_ITEMS_ON_MENU = 10; // given by the WhatsApp API
  const MAX_CONCURRENT_EVENTS = 5; // given by the WhatsApp API
  let templates: WhatsAppTemplate[] = (await getAllWhatsAppTemplates()).filter(
    (t) => t.friendly_name.startsWith(CONTENT_PREFIX),
  );

  if (Boolean(OVERRIDE_TEMPLATES)) {
    for await (const t of templates) {
      try {
        await deleteWhatsAppTemplate(t.sid); // Sequentially delete all templates to avoid rate limiting
      } catch (e: any) {
        console.error("Error deleting WhatsApp Templates ", e.message);
      }
    }
    console.log(`Deleted ${templates.length} templates.`);
    templates = (await getAllWhatsAppTemplates()).filter((t) =>
      t.friendly_name.startsWith(CONTENT_PREFIX),
    );
  }

  try {
    for (const lang of LANGUAGES) {
      const suffix = LANG_SUFFIX[lang];

      for (let numOptions = 1; numOptions <= MAX_ITEMS_ON_MENU; numOptions++) {
        // 1. Check the help-privacy-templates
        templateName = `${CONTENT_PREFIX}show_menu_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getShowHelpTemplate(numOptions, templateName, lang),
          templates,
        );

        // 2. Check the post_registration-templates
        templateName = `${CONTENT_PREFIX}ready_to_order_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getReadyToOrderTemplate(numOptions, templateName, lang),
          templates,
        );

        // 3. Check the post_registration_without_email-templates
        templateName = `${CONTENT_PREFIX}ready_to_order_without_email_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getReadyToOrderWithoutEmailValidationTemplate(numOptions, templateName, lang),
          templates,
        );

        // 4. Check the post_registration_limitless-templates
        templateName = `${CONTENT_PREFIX}ready_to_order_limitless_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getReadyToOrderLimitlessTemplate(numOptions, templateName, lang),
          templates,
        );

        // 5. Check the post_registration_limitless_without_email-templates
        templateName = `${CONTENT_PREFIX}ready_to_order_limitless_without_email_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getReadyToOrderLimitlessWithoutEmailValidationTemplate(numOptions, templateName, lang),
          templates,
        );
      }

      for (let numOptions = 2; numOptions <= MAX_CONCURRENT_EVENTS; numOptions++) {
        // 6. Check the event_registration-templates
        templateName = `${CONTENT_PREFIX}event_registration_${numOptions}${suffix}`;
        checkIfExistsOrCreateTemplate(
          templateName,
          getEventRegistrationTemplate(numOptions, templateName, lang),
          templates,
        );
      }

      // 7. Order cancelled templates
      templateName = `${CONTENT_PREFIX}order_cancelled${suffix}`;
      checkIfExistsOrCreateTemplate(
        templateName,
        getOrderCancelledTemplate(templateName, lang),
        templates,
      );

      // 8. Order ready templates
      templateName = `${CONTENT_PREFIX}order_ready${suffix}`;
      checkIfExistsOrCreateTemplate(
        templateName,
        getOrderReadyTemplate(templateName, PUBLIC_BASE_URL, lang),
        templates,
      );

      // 9. Order reminder templates
      templateName = `${CONTENT_PREFIX}order_reminder${suffix}`;
      checkIfExistsOrCreateTemplate(
        templateName,
        getOrderReminderTemplate(templateName, lang),
        templates,
      );
    }
  } catch (e: any) {
    console.error("Error creating WhatsApp Templates ", e.message);
  }
}
export async function createTwilioRes() {
  await createWhatsAppTemplates();
}
