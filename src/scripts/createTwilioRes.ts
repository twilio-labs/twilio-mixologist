import {
  createServiceInstances,
  deleteWhatsAppTemplate,
  getAllWhatsAppTemplates,
  createWhatsAppTemplate,
} from "@/lib/twilio";
import nextConfig from "../../next.config";
import {
  getEventRegistrationTemplate,
  getHelpPrivacyTemplate,
  getOrderCancelledTemplate,
  getOrderConfirmationTemplate,
  getOrderReadyTemplate,
  getOrderReminderTemplate,
  getReadyToOrderLimitlessTemplate,
  getReadyToOrderLimitlessWithoutEmailValidationTemplate,
  getReadyToOrderTemplate,
  getReadyToOrderWithoutEmailValidationTemplate,
  getWrongOrderTemplate,
  WhatsAppTemplate,
} from "./buildContentTemplates";

// this script runs mostly sequentially. Use a throttled queue later to optimize if needed

const CONTENT_PREFIX = nextConfig?.env?.CONTENT_PREFIX;

let { OVERRIDE_TEMPLATES } = process.env;

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
    // @ts-expect-error - MAX_ITEMS_ON_MENU is a number
    for await (let numOptions of [...Array(MAX_ITEMS_ON_MENU).keys()]) {

      numOptions = numOptions + 1; // 1-indexed
      // 1. Check the help-privacy-templates
      templateName = `${CONTENT_PREFIX}help_privacy_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getHelpPrivacyTemplate(numOptions, templateName),
        templates,
      );

      // 2. Check the wrong_order-templates
      templateName = `${CONTENT_PREFIX}wrong_order_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getWrongOrderTemplate(numOptions, templateName),
        templates,
      );

      // 3. Check the post_registration-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getReadyToOrderTemplate(numOptions, templateName),
        templates,
      );

      // 4. Check the post_registration_without_email-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_without_email_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getReadyToOrderWithoutEmailValidationTemplate(numOptions, templateName),
        templates,
      );

      // 5. Check the post_registration_limitless-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_limitless_${numOptions}`;
      await  checkIfExistsOrCreateTemplate(
        templateName,
        getReadyToOrderLimitlessTemplate(numOptions, templateName),
        templates,
      );

      // 6. Check the post_registration_limitless_without_email-templates
      templateName = `${CONTENT_PREFIX}ready_to_order_limitless_without_email_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getReadyToOrderLimitlessWithoutEmailValidationTemplate(
          numOptions,
          templateName,
        ),
        templates,
      );
    }
    for (
      let numOptions = 2;
      numOptions <= MAX_CONCURRENT_EVENTS;
      numOptions++
    ) {
      // 6. Check the event_registration-templates
      templateName = `${CONTENT_PREFIX}event_registration_${numOptions}`;
      await checkIfExistsOrCreateTemplate(
        templateName,
        getEventRegistrationTemplate(numOptions, templateName),
        templates,
      );
    }

    // 7. Order confirmation templates
    templateName = `${CONTENT_PREFIX}order_confirmation_barista`;
    await checkIfExistsOrCreateTemplate(
      templateName,
      getOrderConfirmationTemplate(templateName, false),
      templates,
    );
    templateName = `${CONTENT_PREFIX}order_confirmation_smoothie`;
    await checkIfExistsOrCreateTemplate(
      templateName,
      getOrderConfirmationTemplate(templateName, true),
      templates,
    );

    // 8. Order cancelled templates
    templateName = `${CONTENT_PREFIX}order_cancelled`;
    await  checkIfExistsOrCreateTemplate(
      templateName,
      getOrderCancelledTemplate(templateName),
      templates,
    );

    // 9. Order ready templates
    templateName = `${CONTENT_PREFIX}order_ready`;
    await  checkIfExistsOrCreateTemplate(
      templateName,
      getOrderReadyTemplate(templateName),
      templates,
    );

    // 10. Order reminder templates
    templateName = `${CONTENT_PREFIX}order_reminder`;
    await checkIfExistsOrCreateTemplate(
      templateName,
      getOrderReminderTemplate(templateName),
      templates,
    );
  } catch (e: any) {
    console.error("Error creating WhatsApp Templates ", e.message, e.response.data.message, e.response.data.more_info);
  }
}
export async function createTwilioRes() {
  await createWhatsAppTemplates();
}
