import {
  createServiceInstances,
  deleteWhatsAppTemplate,
  getAllWhatsAppTemplates,
  createWhatsAppTemplate,
} from "@/lib/twilio";
import {
  getHelpPrivacyTemplate,
  getWrongOrderTemplate,
  getReadyToOrderTemplate,
  getReadyToOrderWithoutEmailValidationTemplate,
  getReadyToOrderLimitlessTemplate,
  getReadyToOrderLimitlessWithoutEmailValidationTemplate,
  getEventRegistrationTemplate,
  WhatsAppTemplate,
} from "./getTemplates";
import nextConfig from "../../next.config";

// this script runs mostly sequentially. Use a throttled queue later to optimize if needed

const CONTENT_PREFIX = nextConfig?.env?.CONTENT_PREFIX;
console.log(`Parsed content prefix is ${CONTENT_PREFIX}`);

const { OVERRIDE_TEMPLATES } = process.env;

(async () => {
  await createServiceInstances();
  await createWhatsAppTemplates();
})();

async function createWhatsAppTemplates() {
  if (!CONTENT_PREFIX) {
    throw new Error("CONTENT_PREFIX is not set in the environment variables");
  }

  let templateName: string, template: WhatsAppTemplate;
  const MAX_ITEMS_ON_MENU = 10; // given by the WhatsApp API
  const MAX_CONCURRENT_EVENTS = 5; // given by the WhatsApp API
  let templates: WhatsAppTemplate[] = (await getAllWhatsAppTemplates()).filter(
    (t) => t.friendly_name.startsWith(CONTENT_PREFIX),
  );

  if (OVERRIDE_TEMPLATES) {
    try {
      for await (const t of templates) {
        await deleteWhatsAppTemplate(t.sid); // Sequentially delete all templates to avoid rate limiting
      }
    } catch (e: any) {
      console.error("Error deleting WhatsApp Templates ", e.message);
    }
    console.log(`Deleted ${templates.length} templates.`);
    templates = (await getAllWhatsAppTemplates()).filter((t) =>
      t.friendly_name.startsWith(CONTENT_PREFIX),
    );
  }

  try {
    for (let numOptions = 1; numOptions <= MAX_ITEMS_ON_MENU; numOptions++) {
      // 1. Check the help-privacy-templates
      templateName = `${CONTENT_PREFIX}help_privacy_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getHelpPrivacyTemplate(numOptions, templateName),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }

      // 2. Check the wrong_order-templates
      templateName = `${CONTENT_PREFIX}wrong_order_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getWrongOrderTemplate(numOptions, templateName),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }

      // 3. Check the post_registration-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getReadyToOrderTemplate(numOptions, templateName),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }

      // 4. Check the post_registration_without_email-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_without_email_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getReadyToOrderWithoutEmailValidationTemplate(
            numOptions,
            templateName,
          ),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }

      // 5. Check the post_registration_limitless-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_limitless_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getReadyToOrderLimitlessTemplate(numOptions, templateName),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }

      // 6. Check the post_registration_limitless_without_email-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_limitless_without_email_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getReadyToOrderLimitlessWithoutEmailValidationTemplate(
            numOptions,
            templateName,
          ),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }
    }
    for (
      let numOptions = 2;
      numOptions <= MAX_CONCURRENT_EVENTS;
      numOptions++
    ) {
      // 6. Check the event_registration-templates
      templateName = `${CONTENT_PREFIX}event_registration_${numOptions}`;
      if (templates.find((c) => c.friendly_name === templateName)) {
        console.log(
          `Skip creating Template because "${templateName}" already exists`,
        );
      } else {
        template = await createWhatsAppTemplate(
          getEventRegistrationTemplate(numOptions, templateName),
        );
        console.log(`Created Template "${templateName}" ${template.sid}`);
      }
    }
  } catch (e: any) {
    console.error("Error creating WhatsApp Templates ", e.message);
  }
}
export async function createTwilioRes() {
  await createWhatsAppTemplates();
}
