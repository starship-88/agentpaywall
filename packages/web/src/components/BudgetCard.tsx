import { useState } from "react";
import { useI18n } from "../lib/useI18n";

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
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);

  return (
    <article id="budget" className="ap-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-ap-ink">{t("budget.title")}</h2>
        {liveOnChain ? (
          <span className="ap-badge text-[10px]">{t("budget.uiOnly")}</span>
        ) : null}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-ap-body">
        {liveOnChain ? t("budget.helpLive") : t("budget.helpStub")}
      </p>

      <label className="mt-5 block text-[12px] font-medium text-ap-muted">
        {t("budget.label")}
        <input
          className={`ap-num mt-2 w-full rounded-2xl border bg-[#faf8ff] px-3 py-2.5 text-lg text-ap-ink outline-none transition ${
            focused ? "border-ap-purple/70" : "border-[rgba(90,70,180,0.12)]"
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
          {t("budget.save")}
        </button>
        <button type="button" className="ap-btn-ghost" disabled={busy} onClick={onReset}>
          {t("budget.reset")}
        </button>
      </div>
      {flash ? <p className="mt-3 text-[13px] text-ap-mint">{flash}</p> : null}
    </article>
  );
}
