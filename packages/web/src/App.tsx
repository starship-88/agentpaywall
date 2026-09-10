import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:40211";

type Budget = {
  dailyCapUsdc: number;
  spentUsdc: number;
  remainingUsdc: number;
  remainingBaseUnits: string;
  spentBaseUnits: string;
  dailyCapBaseUnits: string;
  priceBaseUnits: string;
};

type Status = {
  service: string;
  mode: "stub" | "live";
  settle?: "stub" | "oz-facilitator";
  network: string;
  price: string;
  usdc: { issuer: string; sac: string };
  facilitatorUrl: string;
  recipientSet: boolean;
  spendAccountContractId: string | null;
  budget: Budget;
  verify: string[];
  docs: Record<string, string>;
  ozKeyGen: string;
};

type EventRow = {
  id: string;
  at: string;
  kind: "info" | "402" | "paid" | "cap" | "error";
  message: string;
  pair?: string | null;
  price?: string;
  note?: string;
  remainingBaseUnits?: string;
};

function kindClass(kind: EventRow["kind"]) {
  switch (kind) {
    case "paid":
      return "text-ok";
    case "402":
      return "text-gold";
    case "cap":
      return "text-warn";
    case "error":
      return "text-warn";
    default:
      return "text-mint/80";
  }
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [capInput, setCapInput] = useState("0.01");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        fetch(`${API}/v1/status`).then((r) => {
          if (!r.ok) throw new Error(`status ${r.status}`);
          return r.json() as Promise<Status>;
        }),
        fetch(`${API}/v1/activity`).then((r) => {
          if (!r.ok) throw new Error(`activity ${r.status}`);
          return r.json() as Promise<{ events: EventRow[]; budget: Budget }>;
        }),
      ]);
      setStatus(s);
      setEvents(a.events);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Cannot reach API at ${API}. Start it with npm run dev:api.`
          : "API unreachable",
      );
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2000);
    return () => clearInterval(id);
  }, [load]);

  const [hydratedCap, setHydratedCap] = useState(false);
  useEffect(() => {
    if (status && !hydratedCap) {
      setCapInput(String(status.budget.dailyCapUsdc));
      setHydratedCap(true);
    }
  }, [status, hydratedCap]);

  const pct = useMemo(() => {
    const cap = status?.budget.dailyCapUsdc ?? 0;
    const spent = status?.budget.spentUsdc ?? 0;
    if (cap <= 0) return 0;
    return Math.min(100, Math.round((spent / cap) * 100));
  }, [status]);

  async function saveCap() {
    setBusy(true);
    try {
      const res = await fetch(`${API}/v1/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLimitUsdc: Number(capInput) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "save failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetWindow() {
    setBusy(true);
    try {
      await fetch(`${API}/v1/budget/reset`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function probeFx() {
    setBusy(true);
    setProbe(null);
    try {
      const res = await fetch(`${API}/v1/fx?pair=USD-MXN`);
      const body = await res.json();
      setProbe(
        `${res.status} ${res.status === 402 ? "Payment Required" : ""} — ${JSON.stringify(body).slice(0, 280)}`,
      );
      await load();
    } catch (err) {
      setProbe(err instanceof Error ? err.message : "probe failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <header className="flex flex-col gap-4 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-mint uppercase">
            HackMeridian Lisboa · Stellar Pro
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            AgentPaywall
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
            The human sets a daily USDC budget. The agent pays per HTTP request
            with x402 on Stellar. Exceeding the cap fails — on-chain, in{" "}
            <code className="text-gold">__check_auth</code>.
          </p>
        </div>
        <ModeBadge status={status} />
      </header>

      {error ? (
        <div className="mt-6 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          {error}
        </div>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border border-line bg-panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-mint uppercase">
            Daily cap
          </h2>
          <p className="mt-1 text-sm text-white/60">
            This is the human control surface. Agents cannot raise it.
          </p>

          <label className="mt-5 block text-xs text-white/50">
            USDC per UTC day
            <input
              className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-lg text-white outline-none focus:border-mint"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              inputMode="decimal"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              disabled={busy}
              onClick={() => void saveCap()}
            >
              Set budget
            </button>
            <button
              className="rounded-lg border border-line px-4 py-2 text-sm text-white/80 hover:border-mint"
              disabled={busy}
              onClick={() => void resetWindow()}
            >
              Reset stub window
            </button>
          </div>

          <Meter pct={pct} budget={status?.budget} />

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Spent" value={fmtUsdc(status?.budget.spentUsdc)} />
            <Stat
              label="Remaining"
              value={fmtUsdc(status?.budget.remainingUsdc)}
            />
            <Stat label="Price / request" value={status?.price ?? "—"} />
            <Stat label="Network" value={status?.network ?? "stellar:testnet"} />
          </dl>
        </article>

        <article className="rounded-2xl border border-line bg-panel p-5 lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-mint uppercase">
                Activity
              </h2>
              <p className="mt-1 text-sm text-white/60">
                402 → signed auth entry → settle. Cap hits belong here.
              </p>
            </div>
            <button
              className="rounded-lg border border-gold/50 px-3 py-2 text-sm text-gold hover:bg-gold/10"
              disabled={busy}
              onClick={() => void probeFx()}
            >
              Probe GET /v1/fx (no pay)
            </button>
          </div>
          {probe ? (
            <p className="mt-3 break-all rounded-lg bg-ink px-3 py-2 font-mono text-xs text-white/70">
              {probe}
            </p>
          ) : null}
          <Activity events={events} />
        </article>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <Note title="Agent pays">
          <code className="text-mint">packages/agent</code> GETs the paid
          route, handles 402, signs Soroban auth entries with{" "}
          <code>createEd25519Signer</code>, retries.
        </Note>
        <Note title="Human budgets">
          This page writes the dashboard cap. On-chain enforcement is{" "}
          <code className="text-gold">set_daily_limit</code> on{" "}
          <code>contracts/spend-account</code>.
        </Note>
        <Note title="Adversarial demo">
          <code className="text-mint">npm run start -w @agentpaywall/agent -- --until-cap</code>
          . When remaining &lt; price, the next pay fails.
        </Note>
      </section>

      {status?.verify?.length ? (
        <section className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <h2 className="text-sm font-semibold tracking-wide text-gold uppercase">
            VERIFY — live settle
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
            {status.verify.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/50">
            Facilitator {status.facilitatorUrl}. OZ key:{" "}
            <a className="text-mint underline" href={status.ozKeyGen}>
              {status.ozKeyGen}
            </a>
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-white/40">
            USDC issuer {status.usdc.issuer}
            <br />
            USDC SAC {status.usdc.sac}
          </p>
        </section>
      ) : (
        <p className="mt-6 text-xs text-white/40">
          Live mode. Recipient configured. Still fund USDC + trustlines before
          the first settle.
        </p>
      )}
    </div>
  );
}

function ModeBadge({ status }: { status: Status | null }) {
  if (!status) {
    return (
      <span className="self-start rounded-full border border-line px-3 py-1 font-mono text-xs text-white/50">
        connecting
      </span>
    );
  }
  const live = status.mode === "live";
  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <span
        className={`rounded-full px-3 py-1 font-mono text-xs ${
          live
            ? "bg-ok/15 text-ok"
            : "bg-gold/15 text-gold"
        }`}
      >
        {live ? "LIVE x402 settle" : "STUB — no chain settle"}
      </span>
      <span className="font-mono text-[11px] text-white/40">
        {status.spendAccountContractId
          ? `spend-account ${status.spendAccountContractId.slice(0, 8)}…`
          : "no spend-account C… yet"}
      </span>
    </div>
  );
}

function Meter({ pct, budget }: { pct: number; budget?: Budget }) {
  return (
    <div className="mt-6">
      <div className="mb-1 flex justify-between font-mono text-[11px] text-white/45">
        <span>window spend</span>
        <span>
          {fmtUsdc(budget?.spentUsdc)} / {fmtUsdc(budget?.dailyCapUsdc)} USDC
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink">
        <div
          className={`h-full ${pct >= 100 ? "bg-warn" : "bg-mint"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink px-3 py-2">
      <dt className="text-[11px] tracking-wide text-white/40 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm">{value}</dd>
    </div>
  );
}

function Activity({ events }: { events: EventRow[] }) {
  if (!events.length) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-white/45">
        No payments yet. Run the agent CLI, or probe /v1/fx to see a 402.
      </p>
    );
  }
  return (
    <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
      {events.map((e) => (
        <li
          key={e.id}
          className="rounded-lg border border-line/80 bg-ink px-3 py-2"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`font-mono text-[11px] tracking-wide uppercase ${kindClass(e.kind)}`}
            >
              {e.kind}
            </span>
            <time className="font-mono text-[11px] text-white/35">
              {e.at.replace("T", " ").replace("Z", " UTC")}
            </time>
          </div>
          <p className="mt-1 text-sm text-white/80">{e.message}</p>
        </li>
      ))}
    </ul>
  );
}

function Note({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 text-sm leading-relaxed text-white/70">
      <h3 className="text-white">{title}</h3>
      <p className="mt-2">{children}</p>
    </div>
  );
}

function fmtUsdc(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(4);
}
