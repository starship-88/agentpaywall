import { t, type Locale } from "./i18n";
import type { EventKind, EventRow } from "./types";

function extractPath(message: string): string {
  const m = message.match(/for\s+(\S+)/i);
  return m?.[1] ?? message;
}

function extractAmount(message: string): string {
  const m = message.match(/([\d.]+)\s*USDC/i);
  return m?.[1] ?? "";
}

function extractStatus(message: string): string {
  const m = message.match(/\b(\d{3})\b/);
  return m?.[1] ?? "";
}

export function humanizeEvent(row: EventRow, locale: Locale): string {
  const msg = row.message || "";

  if (
    row.kind === "cap" ||
    /daily.?cap|cap would be exceeded|dailycapexceeded|cap_hit/i.test(msg)
  ) {
    return t("event.cap", undefined, locale);
  }
  if (/402 Payment Required/i.test(msg)) {
    return t("event.paymentAsked", { path: extractPath(msg) }, locale);
  }
  if (/Stub payment accepted/i.test(msg)) {
    return t("event.stubPaid", { path: extractPath(msg) }, locale);
  }
  if (/OZ facilitator settled/i.test(msg)) {
    return t("event.livePaid", undefined, locale);
  }
  if (/Human set daily cap/i.test(msg)) {
    return t("event.capSet", { n: extractAmount(msg) }, locale);
  }
  if (/Human reset the spend window/i.test(msg)) {
    return t("event.windowReset", undefined, locale);
  }
  if (/Budget initialized/i.test(msg)) {
    return t("event.initialized", { n: extractAmount(msg) }, locale);
  }
  if (/UTC day rolled/i.test(msg)) {
    return t("event.dayRolled", undefined, locale);
  }
  if (/Live facilitator unavailable/i.test(msg)) {
    return t("event.facilitatorDown", undefined, locale);
  }
  if (/Facilitator initialize failed/i.test(msg)) {
    return t("event.facilitatorInit", undefined, locale);
  }
  if (/OZ facilitator settle failed/i.test(msg)) {
    return t("event.settleFailed", undefined, locale);
  }
  if (/Live paywall returned/i.test(msg)) {
    return t("event.livePaywallStatus", { status: extractStatus(msg) }, locale);
  }
  return msg;
}

export function kindMessageKey(kind: EventKind) {
  switch (kind) {
    case "paid":
      return "activity.kindPaid" as const;
    case "402":
      return "activity.kind402" as const;
    case "cap":
      return "activity.kindCap" as const;
    case "error":
      return "activity.kindError" as const;
    default:
      return "activity.kindInfo" as const;
  }
}
