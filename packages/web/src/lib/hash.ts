import type { View } from "./types";

const VIEWS: View[] = ["dashboard", "markets", "activity", "docs"];

export function viewFromHash(hash = window.location.hash): View {
  const raw = hash.replace(/^#\/?/, "").split("/")[0]?.toLowerCase() ?? "";
  return (VIEWS as string[]).includes(raw) ? (raw as View) : "dashboard";
}

export function hashForView(view: View): string {
  return `#/${view}`;
}
