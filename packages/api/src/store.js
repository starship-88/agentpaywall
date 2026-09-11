/**
 * In-memory daily USDC budget + activity log.
 * Stub and live paywalls both gate on this window (UTC day).
 * On-chain spend-account is a separate, optional `from` — not this store.
 */

const MAX_EVENTS = 200;

/** @typedef {"info" | "402" | "paid" | "cap" | "error"} EventKind */

function utcDayKey(ms = Date.now()) {
  return Math.floor(ms / 86_400_000);
}

export function createStore(initialCapUsdc, priceBaseUnits) {
  let dailyCapUsdc = initialCapUsdc;
  let windowDay = utcDayKey();
  let spentBaseUnits = 0n;
  /** @type {object[]} */
  const events = [];

  function rollWindow() {
    const day = utcDayKey();
    if (day !== windowDay) {
      windowDay = day;
      spentBaseUnits = 0n;
      push("info", "UTC day rolled — stub spend window reset.");
    }
  }

  function capBaseUnits() {
    return BigInt(Math.round(dailyCapUsdc * 10_000_000));
  }

  function remainingBaseUnits() {
    rollWindow();
    const cap = capBaseUnits();
    return cap > spentBaseUnits ? cap - spentBaseUnits : 0n;
  }

  function push(kind, message, extra = {}) {
    events.unshift({
      id: `${Date.now()}-${events.length}`,
      at: new Date().toISOString(),
      kind,
      message,
      ...extra,
    });
    if (events.length > MAX_EVENTS) events.pop();
  }

  push(
    "info",
    `Budget initialized at ${dailyCapUsdc} USDC / UTC day. Price ${priceBaseUnits} base units per paid request.`,
  );

  return {
    snapshot() {
      rollWindow();
      const cap = capBaseUnits();
      const remaining = remainingBaseUnits();
      return {
        dailyCapUsdc,
        dailyCapBaseUnits: cap.toString(),
        spentUsdc: Number(spentBaseUnits) / 10_000_000,
        spentBaseUnits: spentBaseUnits.toString(),
        remainingUsdc: Number(remaining) / 10_000_000,
        remainingBaseUnits: remaining.toString(),
        windowDay,
        priceBaseUnits: priceBaseUnits.toString(),
      };
    },
    events() {
      return events.slice();
    },
    setDailyCapUsdc(next) {
      if (!Number.isFinite(next) || next < 0) {
        throw new Error("dailyLimitUsdc must be a non-negative number");
      }
      dailyCapUsdc = next;
      push("info", `Human set daily cap to ${next} USDC.`);
      return this.snapshot();
    },
    resetWindow() {
      spentBaseUnits = 0n;
      windowDay = utcDayKey();
      push("info", "Human reset the spend window.");
      return this.snapshot();
    },
    remainingBaseUnits() {
      return remainingBaseUnits();
    },
    /**
     * @returns {{ ok: true } | { ok: false, remaining: bigint }}
     */
    trySpend(amountBaseUnits) {
      rollWindow();
      const remaining = remainingBaseUnits();
      if (amountBaseUnits > remaining) {
        push("cap", "Daily USDC cap would be exceeded.", {
          attemptedBaseUnits: amountBaseUnits.toString(),
          remainingBaseUnits: remaining.toString(),
        });
        return { ok: false, remaining };
      }
      spentBaseUnits += amountBaseUnits;
      return { ok: true };
    },
    recordSpend(amountBaseUnits) {
      rollWindow();
      if (amountBaseUnits <= 0n) return;
      spentBaseUnits += amountBaseUnits;
    },
    refund(amountBaseUnits) {
      rollWindow();
      if (amountBaseUnits <= 0n) return;
      spentBaseUnits =
        spentBaseUnits > amountBaseUnits ? spentBaseUnits - amountBaseUnits : 0n;
    },
    log(kind, message, extra) {
      push(kind, message, extra);
    },
  };
}
