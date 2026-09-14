import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityTable } from "./components/ActivityTable";
import { BudgetCard } from "./components/BudgetCard";
import { DocsView } from "./components/DocsView";
import { HealthBar } from "./components/HealthBar";
import { MarketsTable } from "./components/MarketsTable";
import { MetricCards } from "./components/MetricCards";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import {
  API_URL,
  fetchActivity,
  fetchPairs,
  fetchStatus,
  probeFx,
  resetBudgetWindow,
  setDailyCap,
} from "./lib/api";
import { hashForView, viewFromHash } from "./lib/hash";
import { applyDocumentMeta } from "./lib/i18n";
import { metricBudget, priceUsdcFromBudget } from "./lib/format";
import type { EventRow, PairRow, ProbeResult, Status, View } from "./lib/types";
import { useI18n } from "./lib/useI18n";

type Flash = { kind: "saved"; n: number } | { kind: "reset" } | null;
type AppError = { kind: "apiDown" } | { kind: "save" } | { kind: "reset" } | { kind: "text"; text: string } | null;

export default function App() {
  const { t, locale } = useI18n();
  const [view, setView] = useState<View>(() =>
    typeof window === "undefined" ? "dashboard" : viewFromHash(),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [error, setError] = useState<AppError>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [capInput, setCapInput] = useState("0.01");
  const hydratedCap = useRef(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    applyDocumentMeta(locale);
  }, [locale]);

  const load = useCallback(async (quiet = true) => {
    if (!quiet) setLoading(true);
    try {
      const [s, a, p] = await Promise.all([
        fetchStatus(),
        fetchActivity(),
        fetchPairs().catch(() => [] as PairRow[]),
      ]);
      setStatus(s);
      setEvents(a.events);
      setPairs(p);
      setError(null);
      setUpdatedAt(new Date().toISOString());
      if (!hydratedCap.current) {
        hydratedCap.current = true;
        setCapInput(String(s.budget.dailyCapUsdc));
      }
    } catch {
      setError({ kind: "apiDown" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(true), 2000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onHash = () => {
      setView(viewFromHash());
      setMobileOpen(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((next: View) => {
    setView(next);
    setMobileOpen(false);
    const hash = hashForView(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  const priceUsdc = useMemo(
    () =>
      priceUsdcFromBudget(
        status?.budget.priceBaseUnits ?? status?.priceBaseUnits,
        status?.price,
      ),
    [status],
  );

  async function saveCap() {
    setBusy(true);
    setFlash(null);
    try {
      const n = Number(capInput);
      await setDailyCap(n);
      setFlash({ kind: "saved", n });
      await load(true);
    } catch {
      setError({ kind: "save" });
    } finally {
      setBusy(false);
    }
  }

  async function resetWindow() {
    setBusy(true);
    setFlash(null);
    try {
      await resetBudgetWindow();
      setFlash({ kind: "reset" });
      await load(true);
    } catch {
      setError({ kind: "reset" });
    } finally {
      setBusy(false);
    }
  }

  async function onProbe(pair: string) {
    setBusy(true);
    try {
      const result = await probeFx(pair);
      setProbe(result);
      await load(true);
      if (view !== "markets") navigate("markets");
    } catch (err) {
      setProbe({
        pair,
        httpStatus: 0,
        kind: "error",
        code: "ERROR",
        paymentRequiredHeader: false,
        body: { message: err instanceof Error ? err.message : t("error.probeFailed") },
        at: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  }

  const errorText =
    error?.kind === "apiDown"
      ? t("error.apiDown", { url: API_URL })
      : error?.kind === "save"
        ? t("budget.saveFailed")
        : error?.kind === "reset"
          ? t("budget.resetFailed")
          : error?.kind === "text"
            ? error.text
            : null;

  const flashText =
    flash?.kind === "saved"
      ? t("budget.flashSaved", { n: flash.n })
      : flash?.kind === "reset"
        ? t("budget.flashReset")
        : null;

  return (
    <div className="min-h-dvh text-ap-ink">
      <Sidebar
        view={view}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <TopBar
        view={view}
        status={status}
        loading={loading}
        onRefresh={() => void load(false)}
        onOpenMenu={() => setMobileOpen(true)}
        onNavigate={navigate}
        updatedAt={updatedAt}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {errorText ? (
          <div className="mb-5 rounded-2xl border border-ap-danger/25 bg-ap-danger/8 px-4 py-3 text-sm text-ap-danger">
            {errorText}
          </div>
        ) : null}

        {view === "dashboard" ? (
          <Dashboard
            status={status}
            events={events}
            pairs={pairs}
            loading={loading}
            busy={busy}
            priceUsdc={priceUsdc}
            capInput={capInput}
            onCapInput={setCapInput}
            onSave={() => void saveCap()}
            onReset={() => void resetWindow()}
            flash={flashText}
            onProbe={(pair) => void onProbe(pair)}
            onSeeActivity={() => navigate("activity")}
            onSeeMarkets={() => navigate("markets")}
          />
        ) : null}

        {view === "markets" ? (
          <MarketsTable
            pairs={pairs}
            loading={loading}
            busy={busy}
            probe={probe}
            onProbe={(pair) => void onProbe(pair)}
            priceUsdc={priceUsdc}
          />
        ) : null}

        {view === "activity" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-[1.75rem] font-semibold tracking-tight text-ap-ink">
                {t("activity.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ap-body">
                {t("activity.lead")}
              </p>
            </div>
            <ActivityTable events={events} />
          </div>
        ) : null}

        {view === "docs" ? <DocsView status={status} /> : null}
      </main>
    </div>
  );
}

function Dashboard({
  status,
  events,
  pairs,
  loading,
  busy,
  priceUsdc,
  capInput,
  onCapInput,
  onSave,
  onReset,
  flash,
  onProbe,
  onSeeActivity,
  onSeeMarkets,
}: {
  status: Status | null;
  events: EventRow[];
  pairs: PairRow[];
  loading: boolean;
  busy: boolean;
  priceUsdc: number;
  capInput: string;
  onCapInput: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
  flash: string | null;
  onProbe: (pair: string) => void;
  onSeeActivity: () => void;
  onSeeMarkets: () => void;
}) {
  const { t } = useI18n();
  const metrics = metricBudget(status);

  function scrollToBudget() {
    document.getElementById("budget")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-3xl pb-2 text-center sm:pb-4">
        <p className="text-[13px] font-medium tracking-wide text-ap-purple-deep">
          {t("overview.kicker")}
        </p>
        <h1 className="mt-2 text-[2.35rem] leading-[1.1] font-semibold tracking-tight text-ap-ink sm:text-5xl">
          {t("overview.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-ap-body">
          {t("overview.lead")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="ap-btn-primary" onClick={scrollToBudget}>
            {t("overview.ctaBudget")}
          </button>
          <button type="button" className="ap-btn-ghost" onClick={onSeeMarkets}>
            {t("overview.ctaQuote")}
          </button>
        </div>
      </section>

      <MetricCards
        budget={metrics.budget}
        source={metrics.source}
        priceLabel={status?.price ?? "—"}
        priceUsdc={priceUsdc}
        loading={loading}
      />
      <HealthBar budget={metrics.budget} source={metrics.source} priceUsdc={priceUsdc} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BudgetCard
            capInput={capInput}
            onCapInput={onCapInput}
            busy={busy}
            onSave={onSave}
            onReset={onReset}
            flash={flash}
            liveOnChain={
              Boolean(status?.spendAccount?.enforcesLiveTransfers) ||
              status?.spendAccount?.source === "on-chain"
            }
          />
        </div>
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-ink">{t("overview.recent")}</h2>
            <button
              type="button"
              className="text-[12px] font-medium text-ap-purple-deep hover:underline"
              onClick={onSeeActivity}
            >
              {t("overview.seeAll")}
            </button>
          </div>
          <ActivityTable events={events} compact />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ap-ink">{t("overview.quotes")}</h2>
          <button
            type="button"
            className="text-[12px] font-medium text-ap-purple-deep hover:underline"
            onClick={onSeeMarkets}
          >
            {t("overview.openQuotes")}
          </button>
        </div>
        <MarketsTable
          pairs={pairs.slice(0, 4)}
          loading={loading}
          busy={busy}
          probe={null}
          onProbe={onProbe}
          embedded
          priceUsdc={priceUsdc}
        />
      </div>
    </div>
  );
}
