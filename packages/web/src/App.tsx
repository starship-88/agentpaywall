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
import { metricBudget, priceUsdcFromBudget } from "./lib/format";
import type { EventRow, PairRow, ProbeResult, Status, View } from "./lib/types";

export default function App() {
  const [view, setView] = useState<View>(() =>
    typeof window === "undefined" ? "dashboard" : viewFromHash(),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [capInput, setCapInput] = useState("0.01");
  const hydratedCap = useRef(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

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
      setError(`Cannot reach API at ${API_URL}. Start it with npm run dev:api.`);
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
      setFlash(`Daily cap set to ${n} USDC`);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetWindow() {
    setBusy(true);
    setFlash(null);
    try {
      await resetBudgetWindow();
      setFlash("Spend window reset");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "reset failed");
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
        paymentRequiredHeader: false,
        summary: err instanceof Error ? err.message : "probe failed",
        body: null,
        at: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-ap-bg text-white">
      <Sidebar
        view={view}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="lg:pl-[248px]">
        <TopBar
          status={status}
          loading={loading}
          onRefresh={() => void load(false)}
          onOpenMenu={() => setMobileOpen(true)}
          updatedAt={updatedAt}
        />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {error ? (
            <div className="mb-5 rounded-xl border border-ap-danger/35 bg-ap-danger/10 px-4 py-3 text-sm text-ap-danger">
              {error}
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
              flash={flash}
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
            />
          ) : null}

          {view === "activity" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">Activity</h2>
                <p className="mt-1 text-[13px] text-ap-muted">
                  402 → signed retry → settle. Cap hits and errors belong here.
                </p>
              </div>
              <ActivityTable events={events} />
            </div>
          ) : null}

          {view === "docs" ? <DocsView status={status} /> : null}
        </main>
      </div>
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
  const metrics = metricBudget(status);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ap-muted">
          Daily USDC budget for x402 Exact on Stellar. The agent CLI pays; this
          console never signs a PAYMENT-SIGNATURE.
        </p>
      </div>

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
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <button type="button" className="text-[12px] text-ap-cyan hover:underline" onClick={onSeeActivity}>
              View all
            </button>
          </div>
          <ActivityTable events={events} compact />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Markets</h2>
          <button type="button" className="text-[12px] text-ap-cyan hover:underline" onClick={onSeeMarkets}>
            Open markets
          </button>
        </div>
        <MarketsTable
          pairs={pairs.slice(0, 4)}
          loading={loading}
          busy={busy}
          probe={null}
          onProbe={onProbe}
          embedded
        />
      </div>
    </div>
  );
}
