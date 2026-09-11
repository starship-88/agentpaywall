import { useState } from "react";

type Props = {
  capInput: string;
  onCapInput: (value: string) => void;
  busy: boolean;
  onSave: () => void;
  onReset: () => void;
  flash: string | null;
  liveOnChain: boolean;
};

export function BudgetCard({
  capInput,
  onCapInput,
  busy,
  onSave,
  onReset,
  flash,
  liveOnChain,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <article className="ap-card p-5">
      <h2 className="text-sm font-semibold text-white">Budget controls</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ap-muted">
        {liveOnChain
          ? "Stub/UI only. This setter does not call set_daily_limit and does not move the live __check_auth cap. Cards above read remaining from the C-account."
          : "Set the human daily cap. Agents cannot raise it. Reset clears this UTC window in the API store (not on-chain)."}
      </p>

      <label className="mt-5 block text-[11px] font-medium tracking-wide text-ap-muted uppercase">
        Daily limit (USDC)
        <input
          className={`ap-num mt-2 w-full rounded-xl border bg-black/25 px-3 py-2.5 text-lg text-white outline-none transition ${
            focused ? "border-ap-cyan/70" : "border-white/10"
          }`}
          value={capInput}
          onChange={(e) => onCapInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="decimal"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="ap-btn-primary" disabled={busy} onClick={onSave}>
          Set daily cap
        </button>
        <button type="button" className="ap-btn-ghost" disabled={busy} onClick={onReset}>
          Reset window
        </button>
      </div>
      {flash ? <p className="mt-3 text-[13px] text-ap-ok">{flash}</p> : null}
    </article>
  );
}
