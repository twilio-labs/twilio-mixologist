import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { modes } from "@/config/menus";

export type Language = "en" | "pt-BR";

function modeToBeverage(mode: modes, language: Language, plural: boolean = false) {
  if (language === "pt-BR") {
    return mode === "smoothie"
      ? plural ? "smoothies" : "smoothie"
      : mode === "cocktail"
        ? plural ? "bebidas" : "bebida"
        : mode === "tea"
          ? plural ? "chás" : "chá"
          : plural ? "cafés" : "café";
  }
  return mode === "smoothie"
    ? plural ? "smoothies" : "smoothie"
    : mode === "cocktail"
      ? plural ? "drinks" : "drink"
      : mode === "tea"
        ? "tea"
        : "coffee";
}

export function getModifiersMessage(modifiers: string[], language: Language = "en") {
  if (language === "pt-BR") {
    return `Você pode adicionar os seguintes complementos ao seu pedido:\n${modifiers
      .map((m) => `- ${m}`)
      .join("\n")}`;
  }
  return `You can add the following add-ons to your order:\n${modifiers
    .map((m) => `- ${m}`)
    .join("\n")}`;
}

export function getSystemOfflineMessage(event: Event, language: Language = "en") {
  const { mode } = event.selection;
  if (language === "pt-BR") {
    return `Sem mais ${modeToBeverage(mode, language, true)} 😱\nParece que ficamos sem ${modeToBeverage(mode, language, true)} por hoje. Tenha um ótimo dia!`;
  }
  return `No more ${modeToBeverage(mode, language, true)} 😱\nIt seems like we are out of  ${modeToBeverage(mode, language, true)} for today. Have a great day!`;
}

export function getOopsMessage(error: any, language: Language = "en") {
  if (language === "pt-BR") {
    return `Ops, algo deu errado! Fale com alguém da Twilio e veja se eles podem te ajudar.`;
  }
  return `Oops, something went wrong! Talk to someone from Twilio and see if they can help you.`;
}

export function getNoMediaHandlerMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Desculpe, não suportamos mensagens de mídia. Por favor, envie uma mensagem de texto para fazer seu pedido.";
  }
  return "Sorry, we don't support media messages. Please send a text message to order a drink on us.";
}

export function getInvalidEmailMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Endereço de e-mail inválido. Por favor, responda com um endereço de e-mail corporativo válido.";
  }
  return "Invalid email address. Please reply with a valid business email address.";
}

export function getErrorDuringEmailVerificationMessage(error: string, language: Language = "en") {
  if (language === "pt-BR") {
    return `Ocorreu um erro durante a verificação do e-mail: ${error}`;
  }
  return `An error occurred during email verification: ${error}`;
}

export function getSentEmailMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Enviamos um e-mail com um código de verificação. Por favor, responda com o código que enviamos para o seu endereço de e-mail.\nSe não recebeu o e-mail, verifique sua pasta de spam ou insira um novo endereço de e-mail.";
  }
  return "We have sent you an email with a verification code. Please reply with the code we sent to your email address.\nIf you did not receive the email, please check your spam folder or enter a new email address.";
}

export function getInvalidVerificationCodeMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Código de verificação inválido. Por favor, responda com o código correto.";
  }
  return "Invalid verification code. Please reply with the correct code.";
}

export function getWelcomeMessage(
  mode: modes,
  customWelcomeMessage?: string,
  willCollectedLeads?: boolean,
  language: Language = "en",
) {
  const defaultWelcome = language === "pt-BR"
    ? `Bem-vindo ao Estande da Twilio! Está pronto para um ${modeToBeverage(mode, language)} por nossa conta? 🎉`
    : `Welcome to the Twilio Booth! Are you ready for a ${modeToBeverage(mode, language)} on us? 🎉`;

  const welcomeMessage = customWelcomeMessage || defaultWelcome;

  const leadCollectionSuffix = willCollectedLeads
    ? language === "pt-BR"
      ? "\nResponda com seu nome completo para começar."
      : "\nReply with your full name to get started."
    : "";
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
      `\nEstá pronto para um ${modeToBeverage(mode, language)} por nossa conta?`;
    return `Que bom te ver novamente. Você está agora em ${event}.\n${welcomeMessageSuffix}`;
  }
  const welcomeMessageSuffix =
    customWelcomeMessage ||
    `\nAre you ready for a ${modeToBeverage(mode, language)} on us?`;
  return `We're glad to see you again. You're now at ${event}.\n${welcomeMessageSuffix}`;
}

export function getDataPolicy(mode: string, language: Language = "en") {
  if (language === "pt-BR") {
    return `Usamos seu número de telefone apenas para notificá-lo sobre nosso serviço de ${mode} e apagamos todas as mensagens e números de telefone posteriormente.`;
  }
  return `We only use your phone number to notify you about our ${mode} service and redact all the messages & phone numbers afterward.`;
  // return `We only use your phone number to notify you about our ${mode} service and redact all the messages & phone numbers afterward. You can request to delete your data at any time and cancel open orders by replying with "Forget me".`; TODO switch once implemented and tested
}

export function getPromptForEmail(language: Language = "en") {
  if (language === "pt-BR") {
    return "Obrigado. Por favor, insira seu endereço de e-mail corporativo. Usaremos o Twilio Verify e o SendGrid para enviar uma senha de uso único.";
  }
  return "Thanks. Please enter your business email address. We will then use Twilio Verify and SendGrid to send you an one-time password.";
}

export function getNoActiveEventsMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Que pena! 😕 Parece que não estamos atendendo no momento. Por favor, volte mais tarde. 🙂";
  }
  return "Oh no! 😕 It seems like we are not serving at the moment. Please check back later. 🙂";
}

export function getPausedEventMessage(language: Language = "en") {
  if (language === "pt-BR") {
    return "Olá! Pausamos os pedidos por enquanto. Por favor, volte mais tarde.";
  }
  return "Hey there! We've paused orders for now. Please check back later.";
}
