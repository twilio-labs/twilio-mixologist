require("dotenv").config();
const axios = require('axios');
const { getHelpPrivacyTemplate, getWrongOrderTemplate, getPostRegistrationTemplate } = require("./getTemplates");

console.log(`Initialized client with account sid ${process.env.TWILIO_ACCOUNT_SID}`);

const menuItems = process.env.MENU_ITEMS.split("|").map(rawItem => {
    const elements = rawItem.split(":");
    return {
        shortTitle: elements[0],
        title: elements[1],
        description: elements[2]
    }
});

(async () => {
    const { data } = await axios.get('https://content.twilio.com/v1/Content', {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: process.env.TWILIO_API_KEY,
            password: process.env.TWILIO_API_SECRET
        },
    });

    let templateName;
    const templates = data.contents;

    const neededTemplates = menuItems.length;

    for (let numOptions = 2; numOptions <= neededTemplates; numOptions++) {

        // 1. Check the help-privacy-templates
        templateName = `${process.env.CONTENT_PREFIXES}help_privacy_${numOptions}`;
        if (templates.find(c => c.friendly_name === templateName)) {
            console.log(`Template "${templateName}" already existed`);
        } else {
            await createTemplate(templateName, getHelpPrivacyTemplate(numOptions, templateName))
        }

        // 2. Check the wrong_order-templates
        templateName = `${process.env.CONTENT_PREFIXES}wrong_order_${numOptions}`;
        if (templates.find(c => c.friendly_name === templateName)) {
            console.log(`Template "${templateName}" already existed`);
        } else {
            await createTemplate(templateName, getWrongOrderTemplate(numOptions, templateName))
        }

        // 3. Check the post_registration-templates
        templateName = `${process.env.CONTENT_PREFIXES}post_registration_${numOptions}`;
        if (templates.find(c => c.friendly_name === templateName)) {
            console.log(`Template "${templateName}" already existed`);
        } else {
            await createTemplate(templateName, getPostRegistrationTemplate(numOptions, templateName))
        }
    }
})();


async function createTemplate(name, template) {
    try {
        const { data } = await axios.post('https://content.twilio.com/v1/Content', template, {
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: process.env.TWILIO_API_KEY,
                password: process.env.TWILIO_API_SECRET
            },
        })
        console.log(`Created template "${name}" ${data.sid}`);
    } catch (error) {
        console.error(error)
    }
}