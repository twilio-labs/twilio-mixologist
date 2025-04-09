import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MenuItem } from "@/config/menus";
import { Event } from "@/app/(master-layout)/event/[slug]/page";
import { ICountry, countries } from "countries-list";
import { PhoneNumberUtil } from "google-libphonenumber";

export function getCountryFromPhone(phone: string): ICountry | undefined {
  const phoneUtil = PhoneNumberUtil.getInstance();
  const number = phoneUtil.parseAndKeepRawInput(phone.replace("whatsapp:", ""));
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

export function add(a: number, b: number) {
  return a + b;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export enum EventState {
  OPEN = "OPEN",
  ENDED = "ENDED",
  CLOSED = "CLOSED",
}

export enum Stages {
  NEW_USER = "NEW_USER",
  NAME_CONFIRMED = "NAME_CONFIRMED",
  VERIFYING = "VERIFYING",
  VERIFIED_USER = "VERIFIED_USER",
  FIRST_ORDER = "FIRST_ORDER",
  REPEAT_CUSTOMER = "REPEAT_CUSTOMER",
}

export async function redact(address: string) {
  let redacted =
    address.substring(0, 4) + "****" + address.substring(address.length - 3);
  return redacted;
}

export const TwoWeeksInSeconds = 2 * 7 * 24 * 60 * 60;
export const regexForEmail = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
export const regexFor6ConsecutiveDigits = /\d{6}/;
