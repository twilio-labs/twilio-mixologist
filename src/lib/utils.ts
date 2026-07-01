import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ICountry, countries } from "countries-list";
import { PhoneNumberUtil } from "google-libphonenumber";

export function getCountryFromPhone(phone: string): ICountry | undefined {
  const phoneUtil = PhoneNumberUtil.getInstance();
  const number = phoneUtil.parseAndKeepRawInput(
    phone.replace(/^(whatsapp:|rcs:)/, ""),
  );
  return Object.values(countries).find((country) => {
    const countryCode = number.getCountryCode();
    if (countryCode) {
      return country.phone.includes(countryCode);
    }
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { EventState, Stages } from "@/types";

export async function redact(address: string) {
  let redacted =
    address.substring(0, 4) + "****" + address.substring(address.length - 3);
  return redacted;
}

export const TwoWeeksInSeconds = 2 * 7 * 24 * 60 * 60;
export const regexForEmail = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
export const regexFor6ConsecutiveDigits = /\d{6}/;
