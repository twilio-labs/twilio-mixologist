"use server";

import { validateRequest } from "twilio";
import { TWILIO_AUTH_TOKEN, PUBLIC_BASE_URL } from "./client";

export async function checkSignature(
  signature: string,
  url: string,
  formData?: FormData,
) {
  const regexLocalhost = /^[http|https]+:\/\/localhost(:\d+)?/;

  if (regexLocalhost.test(url)) {
    url = url.replace(regexLocalhost, PUBLIC_BASE_URL);
  }

  let data: any = {};
  if (formData) {
    formData.forEach((value, key) => {
      data[key] = value;
    });
  }

  return validateRequest(TWILIO_AUTH_TOKEN, signature, url, data);
}
