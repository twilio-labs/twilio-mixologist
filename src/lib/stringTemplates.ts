import type { Event, modes, Language, LeadCollection } from "@/types";

export type { Language } from "@/types";

export function eventLang(event: Event): Language {
  return event.language ?? "en";
}

export function modeToBeverage(mode: modes, language: Language, plural: boolean = false) {
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
  if (language === "fr") {
    return mode === "smoothie"
      ? plural ? "smoothies" : "smoothie"
      : mode === "cocktail"
        ? plural ? "boissons" : "boisson"
        : mode === "tea"
          ? plural ? "thés" : "thé"
          : mode === "waffles"
            ? plural ? "gaufres" : "gaufre"
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

export function getModifiersMessage(modifiers: string[], language: Language = "en") {
  if (language === "pt-BR") {
    return `Você pode adicionar os seguintes complementos ao seu pedido:\n${modifiers
      .map((m) => `- ${m}`)
      .join("\n")}`;
  }
  if (language === "fr") {
    return `Vous pouvez ajouter les compléments suivants à votre commande :\n${modifiers
      .map((m) => `- ${m}`)
      .join("\n")}`;
  }
  return `You can add the following add-ons to your order:\n${modifiers
    .map((m) => `- ${m}`)
    .join("\n")}`;
}

export function getInvalidEmailMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Endereço de e-mail inválido. Por favor, responda com um endereço de e-mail corporativo válido.";
  }
  if (language === "fr") {
    return "Adresse e-mail invalide. Veuillez répondre avec une adresse e-mail professionnelle valide.";
  }
  return "Invalid email address. Please reply with a valid business email address.";
}

export function getErrorDuringEmailVerificationMessage(error: string, language: Language = "en") {
  if (language === "pt-BR") {
    return `Ocorreu um erro durante a verificação do e-mail: ${error}`;
  }
  if (language === "fr") {
    return `Une erreur est survenue lors de la vérification de l'e-mail : ${error}`;
  }
  return `An error occurred during email verification: ${error}`;
}

export function getSentEmailMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Enviamos um e-mail com um código de verificação. Por favor, responda com o código que enviamos para o seu endereço de e-mail.\nSe não recebeu o e-mail, verifique sua pasta de spam ou insira um novo endereço de e-mail.";
  }
  if (language === "fr") {
    return "Nous vous avons envoyé un e-mail avec un code de vérification. Veuillez répondre avec le code que nous avons envoyé à votre adresse e-mail.\nSi vous n'avez pas reçu l'e-mail, vérifiez votre dossier spam ou saisissez une nouvelle adresse e-mail.";
  }
  return "We have sent you an email with a verification code. Please reply with the code we sent to your email address.\nIf you did not receive the email, please check your spam folder or enter a new email address.";
}

export function getInvalidVerificationCodeMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Código de verificação inválido. Por favor, responda com o código correto.";
  }
  if (language === "fr") {
    return "Code de vérification invalide. Veuillez répondre avec le code correct.";
  }
  return "Invalid verification code. Please reply with the correct code.";
}

export function getWelcomeMessage(
  mode: modes,
  customWelcomeMessage?: string,
  leadCollection: LeadCollection = "NONE",
  language: Language = "en",
) {
  const defaultWelcome = language === "pt-BR"
    ? `A Twilio te dá as boas-vindas! Que tal um ${modeToBeverage(mode, language)} por nossa conta? 🎉`
    : language === "fr"
      ? `Twilio vous souhaite la bienvenue ! Nous vous offrons votre ${modeToBeverage(mode, language)} 🎉`
      : `Twilio welcomes you! Are you ready for a ${modeToBeverage(mode, language)} on us? 🎉`;

  const welcomeMessage = customWelcomeMessage || defaultWelcome;

  let leadCollectionSuffix = "";
  if (leadCollection === "WeAreDevs_QR") {
    leadCollectionSuffix = language === "pt-BR"
      ? "\nEnvie uma foto do QR code do seu crachá para começar."
      : language === "fr"
        ? "\nEnvoyez une photo du QR code de votre badge pour commencer."
        : "\nSend a photo of your badge QR code to get started.";
  } else if (leadCollection === "MANUAL") {
    leadCollectionSuffix = language === "pt-BR"
      ? "\nResponda com seu nome completo para começar."
      : language === "fr"
        ? "\nRépondez avec votre nom complet pour commencer."
        : "\nReply with your full name to get started.";
  }
  return `${welcomeMessage}\n${leadCollectionSuffix}`;
}

export function getWelcomeBackMessage(
  mode: modes,
  event: string,
  customWelcomeMessage?: string,
  language: Language = "en",
) {
  if (language === "pt-BR") {
    const welcomeMessageSuffix =
      customWelcomeMessage ||
      `\nQue tal um ${modeToBeverage(mode, language)} por nossa conta?`;
    return `Que bom te ver novamente. Você está agora em ${event}.\n${welcomeMessageSuffix}`;
  }
  if (language === "fr") {
    const welcomeMessageSuffix =
      customWelcomeMessage ||
      `\nNous vous offrons votre ${modeToBeverage(mode, language)}, envie de commander ?`;
    return `Quel plaisir de vous revoir ! Vous êtes maintenant à ${event}.\n${welcomeMessageSuffix}`;
  }
  const welcomeMessageSuffix =
    customWelcomeMessage ||
    `\nAre you ready for a ${modeToBeverage(mode, language)} on us?`;
  return `We're glad to see you again. You're now at ${event}.\n${welcomeMessageSuffix}`;
}

const WITH: Record<Language, string> = { en: "with", "pt-BR": "com", fr: "avec" };

export function getSampleOrder(selection: Event["selection"], language: Language = "en") {
  const { items, modifiers } = selection;
  const item = items[1] ?? items[0];
  if (!item) return "";
  if (modifiers.length === 0) return item.title;
  return `${item.title} ${WITH[language]} ${modifiers[modifiers.length - 1]}`;
}

const FORGET_ME_TRIGGERS = [
  "forget me",
  "esqueça de mim",
  "esqueca de mim",
  "oubliez-moi",
  "oubliez moi",
  "oublie-moi",
  "oublie moi",
];

export function isForgetMeRequest(message: string) {
  const lowerMessage = message.toLowerCase();
  return FORGET_ME_TRIGGERS.some((trigger) => lowerMessage.includes(trigger));
}

export function getDataPolicy(mode: string, language: Language = "en") {
  if (language === "pt-BR") {
    return `Usamos seu número de telefone apenas para enviar notificações sobre nosso serviço de ${mode} e apagamos todas as mensagens e números de telefone posteriormente. Você pode solicitar a exclusão dos seus dados a qualquer momento respondendo "Esqueça de mim".`;
  }
  if (language === "fr") {
    return `Nous utilisons votre numéro de téléphone uniquement pour vous informer de notre service de ${mode} et nous supprimons ensuite tous les messages et numéros de téléphone. Vous pouvez demander la suppression de vos données à tout moment en répondant « Oubliez-moi ».`;
  }
  return `We only use your phone number to notify you about our ${mode} service and redact all the messages & phone numbers afterward. You can request to delete your data at any time by replying with "Forget me".`;
}

export function getPromptForEmail(language: Language = "en") {
  if (language === "pt-BR") {
    return "Obrigado. Por favor, insira seu endereço de e-mail corporativo. Usaremos o Twilio Verify e o SendGrid para enviar uma senha de uso único.";
  }
  if (language === "fr") {
    return "Merci. Veuillez saisir votre adresse e-mail professionnelle. Nous utiliserons Twilio Verify et SendGrid pour vous envoyer un mot de passe à usage unique.";
  }
  return "Thanks. Please enter your business email address. We will then use Twilio Verify and SendGrid to send you an one-time password.";
}

export function getNoActiveEventsMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Que pena! 😕 Parece que não estamos atendendo no momento. Por favor, volte mais tarde. 🙂";
  }
  if (language === "fr") {
    return "Oh non ! 😕 Il semble que nous ne servions pas pour le moment. Veuillez revenir plus tard. 🙂";
  }
  return "Oh no! 😕 It seems like we are not serving at the moment. Please check back later. 🙂";
}

export function getPausedEventMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Olá! Pausamos os pedidos por enquanto. Por favor, volte mais tarde.";
  }
  if (language === "fr") {
    return "Bonjour ! Nous avons mis les commandes en pause pour l'instant. Veuillez revenir plus tard.";
  }
  return "Hey there! We've paused orders for now. Please check back later.";
}
