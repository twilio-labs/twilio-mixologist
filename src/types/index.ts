// Central type definitions for the application.
// All shared interfaces and enums live here to avoid circular imports.

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

export enum modes {
  barista = "barista",
  smoothie = "smoothie",
  cocktail = "cocktail",
  tea = "tea",
  waffles = "waffles",
}

export type Language = "en" | "pt-BR";

export interface MenuItem {
  shortTitle: string;
  title: string;
  description: string;
  originalTitle?: string;
}

export type Menus = {
  [key in modes]: {
    items: MenuItem[];
    modifiers?: string[];
  };
};

export interface Order {
  key: string;
  manual?: boolean;
  item: string;
  modifiers?: string;
  address?: string;
  orderNumber?: number;
  originalText?: string;
  status: "queued" | "cancelled" | "ready" | "delivered";
  reminded?: true;
  channel?: "rcs" | "whatsapp" | "sms" | "other";
}

export interface Selection {
  items: MenuItem[];
  modifiers: string[];
  originalModifiers?: string[];
  mode: modes;
}

export type LeadCollection = "MANUAL" | "WeAreDevs_QR" | "NONE";

export interface Event {
  name: string;
  slug: string;
  state: EventState;
  leadCollection: LeadCollection;
  senders: string[];
  selection: Selection;
  pickupLocation: string;
  maxOrders: number;
  welcomeMessage: string;
  language?: Language;
  cancelledCount?: number;
  deliveredCount?: number;
}

export interface SegmentData {
  foundInSegment: boolean;
  [trait: string]: unknown;
}

export interface AttendeeRecord {
  event?: string;
  stage?: Stages;
  orderCount?: number;
  lastOrderNumber?: number;
  dailyOrderCount?: number;
  dailyOrderDate?: string;
  aiHistory?: Array<{ role: string; content: string }>;
  profileId?: string;
  fullName?: string;
  email?: string;
  checkSid?: string;
  company?: string;
  jobTitle?: string;
  country?: string;
  foundInSegment?: boolean;
  [traitKey: string]: unknown;
}
