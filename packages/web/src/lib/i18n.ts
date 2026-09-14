export type Locale = "en" | "es";

export const LANG_STORAGE_KEY = "agentpaywall.lang";

const en = {
  meta: {
    title: "AgentPaywall — daily USDC budget for agents",
    description:
      "You set a daily USDC budget. The agent pays per request. When the budget is gone, the chain says no.",
  },
  brand: {
    name: "AgentPaywall",
    tagline: "Daily USDC budget",
  },
  nav: {
    overview: "Overview",
    overviewHint: "Budget and what’s left",
    markets: "Get a quote (pay)",
    marketsHint: "Ask for a price — this page does not pay",
    activity: "What happened",
    activityHint: "Paid, asked, and budget used up",
    docs: "How it works",
    docsHint: "A short, plain walkthrough",
  },
  top: {
    subtitle: "You set the budget. The agent pays per request.",
    refresh: "Refresh",
    refreshTitle: "Last update {time}",
    menu: "Open menu",
    closeMenu: "Close menu",
  },
  lang: {
    en: "EN",
    es: "ES",
    enFull: "English",
    esFull: "Español",
    switcher: "Language",
  },
  badge: {
    live: "Live on Stellar testnet",
    stub: "Demo without chain (stub)",
    connecting: "Connecting…",
    onChain: "On-chain",
    unavailable: "Can't read chain",
  },
  overview: {
    kicker: "AgentPaywall",
    title: "Overview",
    lead: "You set a daily USDC budget. The agent pays per request. When the budget is gone, the chain says no.",
    ctaBudget: "Set daily budget",
    ctaQuote: "Get a quote",
    recent: "Latest activity",
    seeAll: "See all",
    quotes: "Quotes",
    openQuotes: "See all quotes",
  },
  metric: {
    dailyBudget: "Daily budget",
    dailyBudgetHint: "USDC per UTC day",
    dailyBudgetHintOnChain: "USDC per UTC day, on-chain",
    spent: "Spent today",
    spentHint: "This window",
    spentHintOnChain: "Recorded on-chain today",
    remaining: "Left to spend",
    quotesLeftOne: "{n} quote left",
    quotesLeftOther: "{n} quotes left",
    remainingUnavailable: "Could not read remaining from the chain",
    price: "Price per request",
    priceHint: "Paid in USDC each time",
  },
  health: {
    title: "How the budget is doing",
    ok: "Plenty left for today",
    warn: "Running low — keep an eye on the agent",
    dangerEmpty: "Budget used up for today — the chain will say no",
    dangerLow: "Not enough left for even one quote",
    unavailable: "Could not read the on-chain remaining amount",
    utilized: "{pct}% used",
    spent: "spent {amount}",
    cap: "budget {amount} USDC",
  },
  budget: {
    title: "Daily budget",
    helpLive:
      "This control only updates the dashboard. It does not change the live on-chain daily limit. The numbers above come from the spend account on-chain.",
    helpStub:
      "Set how much USDC the agent may spend today. Agents cannot raise this. Reset only clears this UTC window in the API (not on-chain).",
    uiOnly: "Dashboard only — does not move the on-chain cap",
    label: "Daily limit (USDC)",
    save: "Save budget",
    reset: "Start the day over",
    flashSaved: "Daily budget set to {n} USDC",
    flashReset: "Today’s window was reset",
    saveFailed: "Could not save the budget",
    resetFailed: "Could not reset the window",
  },
  activity: {
    title: "What happened",
    lead: "Each request: ask → pay → settle. “Budget used up for today” and errors show up here.",
    empty: "Nothing yet. Run the agent, or ask for a quote to log a payment request.",
    kind: "Kind",
    event: "What happened",
    pair: "Pair",
    time: "When",
    kindPaid: "Paid",
    kind402: "Payment asked",
    kindCap: "Budget used up for today",
    kindError: "Error",
    kindInfo: "Note",
  },
  markets: {
    title: "Get a quote (pay)",
    lead: "Mock FX pairs behind GET /v1/fx. Asking from this browser does not pay — you’ll get a 402 payment request. The agent CLI signs and retries.",
    pair: "Pair",
    rate: "Rate",
    venue: "Venue",
    action: "Action",
    pay: "Get a quote (pay)",
    loading: "Loading quotes…",
    empty: "No pairs from the API. Confirm GET /v1/pairs.",
    probeEmpty: "No quote yet. “Get a quote (pay)” calls unpaid GET /v1/fx and should return 402.",
    probeUnpaid:
      "Payment required. This page does not sign. Run the agent CLI to pay {price} USDC and retry.",
    probeCap: "Budget used up for today. {remaining} USDC left. This request was not settled.",
    probePaid: "Paid quote {pair} @ {rate} ({source}).",
    probeError: "Something went wrong ({status}).",
    paymentRequired: "Payment required",
    kindUnpaid: "Payment asked",
    kindPaid: "Paid",
    kindCap: "Budget used up",
    kindError: "Error",
  },
  docs: {
    title: "How it works",
    lead: "Short version: you set a daily USDC budget; the agent pays per request; when the budget is gone the chain says no.",
    empty: "How-it-works links appear once the API is reachable.",
    whatTitle: "What this is",
    whatBody:
      "AgentPaywall is a daily USDC budget for an agent that pays per HTTP request. You decide the budget. The agent cannot raise it. When the money is gone, settlement fails on the chain.",
    humanTitle: "What you do",
    humanBody:
      "On Overview, set a daily USDC budget. That is the most the agent may spend before the next UTC day. If a live spend-account is connected, the cards prefer the on-chain remaining amount.",
    agentTitle: "What the agent does",
    agentBody:
      "The agent calls a paid endpoint (for example GET /v1/fx). The API answers with a payment request (HTTP 402). The agent signs and retries. This website never signs a payment.",
    chainTitle: "When the chain says no",
    chainBody:
      "If the next quote would exceed today’s budget, the API returns “Budget used up for today” (DAILY_CAP_EXCEEDED). In live mode the spend-account contract refuses the transfer.",
    links: "Official links",
    constants: "Network details",
    network: "Network",
    modeSettle: "Mode / settle",
    usdcIssuer: "USDC issuer",
    usdcSac: "USDC contract",
    facilitator: "Facilitator",
    spendAccount: "Spend account",
    onChainCap: "On-chain budget",
    onChainCapYes:
      "Yes — live payments come from the C-account; a used-up budget is DailyCapExceeded",
    onChainCapNo: "No — demo mode or a classic G-account payer",
    remainingOnChain: "Left to spend (on-chain)",
    remainingNone: "not simulated",
    notSet: "not set",
    ozKey: "OZ API key",
    linkX402: "x402 on Stellar",
    linkBuilt: "Built on Stellar",
    linkQuick: "Quickstart",
    linkSpend: "Spend limits",
    linkComplex: "Complex account",
    linkDemo: "Stellar x402 demo",
    linkNpm: "@x402/stellar",
  },
  event: {
    cap: "Budget used up for today. This request was not settled.",
    paymentAsked: "Payment asked for {path}",
    stubPaid: "Demo payment accepted for {path}",
    livePaid: "Paid on Stellar testnet (facilitator settled USDC).",
    capSet: "You set the daily budget to {n} USDC.",
    windowReset: "You started today’s window over.",
    initialized: "Budget started at {n} USDC per UTC day.",
    dayRolled: "New UTC day — today’s spend window reset.",
    facilitatorDown: "Live facilitator is unavailable.",
    facilitatorInit: "Facilitator failed to start.",
    settleFailed: "Settlement failed.",
    livePaywallStatus: "Live paywall returned {status}.",
  },
  error: {
    apiDown: "Cannot reach the API at {url}. Start it with npm run dev:api.",
    generic: "Something went wrong",
    probeFailed: "Could not ask for a quote",
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

const es: DeepString<typeof en> = {
  meta: {
    title: "AgentPaywall — presupuesto diario en USDC para agentes",
    description:
      "Tú fijas un presupuesto diario en USDC. El agente paga por cada petición. Cuando se acaba, la cadena dice que no.",
  },
  brand: {
    name: "AgentPaywall",
    tagline: "Presupuesto diario en USDC",
  },
  nav: {
    overview: "Resumen",
    overviewHint: "Presupuesto y lo que queda",
    markets: "Pedir cotización (pagar)",
    marketsHint: "Pides el precio — esta página no paga",
    activity: "Qué pasó",
    activityHint: "Pagos, peticiones y presupuesto agotado",
    docs: "Cómo funciona",
    docsHint: "Una guía corta y clara",
  },
  top: {
    subtitle: "Tú fijas el presupuesto. El agente paga por petición.",
    refresh: "Actualizar",
    refreshTitle: "Última actualización {time}",
    menu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  lang: {
    en: "EN",
    es: "ES",
    enFull: "English",
    esFull: "Español",
    switcher: "Idioma",
  },
  badge: {
    live: "En vivo en Stellar testnet",
    stub: "Demo sin cadena (stub)",
    connecting: "Conectando…",
    onChain: "En cadena",
    unavailable: "Sin lectura de cadena",
  },
  overview: {
    kicker: "AgentPaywall",
    title: "Resumen",
    lead: "Tú fijas un presupuesto diario en USDC. El agente paga por cada petición. Cuando se acaba, la cadena dice que no.",
    ctaBudget: "Fijar presupuesto diario",
    ctaQuote: "Pedir cotización",
    recent: "Actividad reciente",
    seeAll: "Ver todo",
    quotes: "Cotizaciones",
    openQuotes: "Ver todas las cotizaciones",
  },
  metric: {
    dailyBudget: "Presupuesto diario",
    dailyBudgetHint: "USDC por día UTC",
    dailyBudgetHintOnChain: "USDC por día UTC, en cadena",
    spent: "Gastado hoy",
    spentHint: "Esta ventana",
    spentHintOnChain: "Anotado hoy en la cadena",
    remaining: "Te queda",
    quotesLeftOne: "{n} cotización restante",
    quotesLeftOther: "{n} cotizaciones restantes",
    remainingUnavailable: "No se pudo leer lo que queda en la cadena",
    price: "Precio por petición",
    priceHint: "Se paga en USDC cada vez",
  },
  health: {
    title: "Cómo va el presupuesto",
    ok: "Queda bastante para hoy",
    warn: "Queda poco — vigila al agente",
    dangerEmpty: "Se acabó el presupuesto de hoy — la cadena dirá que no",
    dangerLow: "No alcanza ni para una cotización",
    unavailable: "No se pudo leer el restante en cadena",
    utilized: "{pct}% usado",
    spent: "gastado {amount}",
    cap: "presupuesto {amount} USDC",
  },
  budget: {
    title: "Presupuesto diario",
    helpLive:
      "Este control solo actualiza el panel. No cambia el límite diario que vive en la cadena. Los números de arriba salen de la cuenta de gasto en cadena.",
    helpStub:
      "Elige cuánto USDC puede gastar el agente hoy. El agente no puede subirlo. Reiniciar solo limpia esta ventana UTC en la API (no en la cadena).",
    uiOnly: "Solo el panel — no mueve el tope en cadena",
    label: "Límite diario (USDC)",
    save: "Guardar presupuesto",
    reset: "Empezar el día de nuevo",
    flashSaved: "Presupuesto diario fijado en {n} USDC",
    flashReset: "Se reinició la ventana de hoy",
    saveFailed: "No se pudo guardar el presupuesto",
    resetFailed: "No se pudo reiniciar la ventana",
  },
  activity: {
    title: "Qué pasó",
    lead: "Cada petición: pedir → pagar → liquidar. Aquí aparecen “Se acabó el presupuesto de hoy” y los errores.",
    empty: "Aún no hay nada. Ejecuta el agente o pide una cotización para registrar un cobro.",
    kind: "Tipo",
    event: "Qué pasó",
    pair: "Par",
    time: "Cuándo",
    kindPaid: "Pagado",
    kind402: "Pago pedido",
    kindCap: "Se acabó el presupuesto de hoy",
    kindError: "Error",
    kindInfo: "Nota",
  },
  markets: {
    title: "Pedir cotización (pagar)",
    lead: "Pares de cambio de ejemplo detrás de GET /v1/fx. Pedir desde el navegador no paga: verás un 402 pidiendo pago. El agente (CLI) firma y reintenta.",
    pair: "Par",
    rate: "Tipo",
    venue: "Origen",
    action: "Acción",
    pay: "Pedir cotización (pagar)",
    loading: "Cargando cotizaciones…",
    empty: "No hay pares desde la API. Comprueba GET /v1/pairs.",
    probeEmpty:
      "Aún no hay cotización. “Pedir cotización (pagar)” llama a GET /v1/fx sin pagar y debería devolver 402.",
    probeUnpaid:
      "Hace falta pagar. Esta página no firma. Ejecuta el agente (CLI) para pagar {price} USDC y reintentar.",
    probeCap: "Se acabó el presupuesto de hoy. Quedan {remaining} USDC. Esta petición no se liquidó.",
    probePaid: "Cotización pagada {pair} @ {rate} ({source}).",
    probeError: "Algo salió mal ({status}).",
    paymentRequired: "Pago requerido",
    kindUnpaid: "Pago pedido",
    kindPaid: "Pagado",
    kindCap: "Presupuesto agotado",
    kindError: "Error",
  },
  docs: {
    title: "Cómo funciona",
    lead: "En corto: tú fijas un presupuesto diario en USDC; el agente paga por cada petición; cuando se acaba, la cadena dice que no.",
    empty: "Los enlaces aparecen cuando la API está disponible.",
    whatTitle: "Qué es esto",
    whatBody:
      "AgentPaywall es un presupuesto diario en USDC para un agente que paga por cada petición HTTP. Tú decides el tope. El agente no puede subirlo. Cuando se acaba el dinero, el cobro falla en la cadena.",
    humanTitle: "Qué haces tú",
    humanBody:
      "En Resumen, fijas un presupuesto diario en USDC. Eso es lo máximo que el agente puede gastar hasta el siguiente día UTC. Si hay una cuenta de gasto en vivo, las tarjetas prefieren el restante en cadena.",
    agentTitle: "Qué hace el agente",
    agentBody:
      "El agente llama a un endpoint de pago (por ejemplo GET /v1/fx). La API responde pidiendo pago (HTTP 402). El agente firma y reintenta. Esta web nunca firma un pago.",
    chainTitle: "Cuando la cadena dice que no",
    chainBody:
      "Si la siguiente cotización superaría el presupuesto de hoy, la API responde “Se acabó el presupuesto de hoy” (DAILY_CAP_EXCEEDED). En modo en vivo el contrato de la cuenta de gasto rechaza la transferencia.",
    links: "Enlaces oficiales",
    constants: "Datos de la red",
    network: "Red",
    modeSettle: "Modo / liquidación",
    usdcIssuer: "Emisor USDC",
    usdcSac: "Contrato USDC",
    facilitator: "Facilitador",
    spendAccount: "Cuenta de gasto",
    onChainCap: "Presupuesto en cadena",
    onChainCapYes:
      "Sí — los pagos en vivo salen de la cuenta C…; un presupuesto agotado es DailyCapExceeded",
    onChainCapNo: "No — modo demo o un pagador clásico G…",
    remainingOnChain: "Te queda (en cadena)",
    remainingNone: "no simulado",
    notSet: "sin definir",
    ozKey: "Clave API de OZ",
    linkX402: "x402 en Stellar",
    linkBuilt: "Hecho en Stellar",
    linkQuick: "Guía rápida",
    linkSpend: "Límites de gasto",
    linkComplex: "Cuenta compleja",
    linkDemo: "Demo x402 de Stellar",
    linkNpm: "@x402/stellar",
  },
  event: {
    cap: "Se acabó el presupuesto de hoy. Esta petición no se liquidó.",
    paymentAsked: "Se pidió pago para {path}",
    stubPaid: "Pago de demo aceptado para {path}",
    livePaid: "Pagado en Stellar testnet (el facilitador liquidó USDC).",
    capSet: "Fijaste el presupuesto diario en {n} USDC.",
    windowReset: "Reiniciaste la ventana de hoy.",
    initialized: "El presupuesto empezó en {n} USDC por día UTC.",
    dayRolled: "Nuevo día UTC — se reinició el gasto de hoy.",
    facilitatorDown: "El facilitador en vivo no está disponible.",
    facilitatorInit: "El facilitador no pudo arrancar.",
    settleFailed: "La liquidación falló.",
    livePaywallStatus: "El paywall en vivo respondió {status}.",
  },
  error: {
    apiDown: "No se puede alcanzar la API en {url}. Arráncala con npm run dev:api.",
    generic: "Algo salió mal",
    probeFailed: "No se pudo pedir la cotización",
  },
};

export const messages: Record<Locale, DeepString<typeof en>> = { en, es };

export type MessageTree = DeepString<typeof en>;

type LeafPaths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? P extends ""
      ? K
      : `${P}.${K}`
    : LeafPaths<T[K], P extends "" ? K : `${P}.${K}`>;
}[keyof T & string];

export type MessageKey = LeafPaths<MessageTree>;

export type Vars = Record<string, string | number>;

const listeners = new Set<() => void>();
let current: Locale = "en";
let hydrated = false;

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const candidates = [
    navigator.language,
    ...(navigator.languages ?? []),
  ].filter(Boolean);
  for (const raw of candidates) {
    if (String(raw).toLowerCase().startsWith("es")) return "es";
  }
  return "en";
}

export function detectLocale(): Locale {
  return readStoredLocale() ?? detectBrowserLocale();
}

function emit() {
  for (const fn of listeners) fn();
}

export function getLocale(): Locale {
  if (!hydrated && typeof window !== "undefined") {
    current = detectLocale();
    hydrated = true;
  }
  return current;
}

export function setLocale(next: Locale) {
  current = next;
  hydrated = true;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  applyDocumentMeta(next);
  emit();
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function localeTag(locale: Locale = getLocale()): string {
  return locale === "es" ? "es-ES" : "en-US";
}

function lookup(tree: MessageTree, key: string): string | undefined {
  let cur: unknown = tree;
  for (const part of key.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? `{${name}}` : String(vars[name]),
  );
}

export function t(key: MessageKey, vars?: Vars, locale: Locale = getLocale()): string {
  const raw = lookup(messages[locale], key) ?? lookup(messages.en, key) ?? key;
  return interpolate(raw, vars);
}

export function applyDocumentMeta(locale: Locale = getLocale()) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "es" ? "es" : "en";
  document.title = t("meta.title", undefined, locale);
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t("meta.description", undefined, locale));
}

export function quotesLeftLabel(n: number, locale: Locale = getLocale()): string {
  const key = n === 1 ? "metric.quotesLeftOne" : "metric.quotesLeftOther";
  return t(key, { n }, locale);
}
