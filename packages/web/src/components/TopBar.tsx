import { previewAddress } from "../lib/format";
import type { Status } from "../lib/types";
import { IconMenu, IconRefresh } from "./icons";

type Props = {
  status: Status | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenMenu: () => void;
  updatedAt: string | null;
};

export function TopBar({ status, loading, onRefresh, onOpenMenu, updatedAt }: Props) {
  const mode = status?.mode;
  const network = status?.network ?? "stellar:testnet";
  const settle = status?.settle;
  const contractId = status?.spendAccount?.contractId;
  const contractPreview = contractId ? previewAddress(contractId) : null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/8 bg-ap-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-ap-muted hover:bg-white/5 lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">AgentPaywall</p>
          <p className="hidden truncate text-[11px] text-ap-muted sm:block">
            Human budget · agent pays per HTTP request
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="ap-badge hidden font-mono sm:inline-flex">{network}</span>
        {mode ? (
          <span
            className={`ap-badge font-mono ${
              mode === "live"
                ? "border-ap-ok/30 bg-ap-ok/10 text-ap-ok"
                : "border-ap-warn/35 bg-ap-warn/10 text-ap-warn"
            }`}
            title={settle ? `settle: ${settle}` : undefined}
          >
            {mode}
          </span>
        ) : (
          <span className="ap-badge font-mono text-ap-muted">connecting</span>
        )}
        {contractPreview ? (
          <span
            className="ap-badge hidden font-mono text-ap-mint sm:inline-flex"
            title={contractId ?? undefined}
          >
            {contractPreview}
          </span>
        ) : null}
        <button
          type="button"
          className="ap-btn-ghost h-9 px-3"
          onClick={onRefresh}
          disabled={loading}
          title={updatedAt ? `Last poll ${updatedAt}` : "Refresh"}
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}
