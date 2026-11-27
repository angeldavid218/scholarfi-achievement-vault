import { IconCoin } from "../ui/icons";
import { formatWholeTokenDisplay } from "../../solana/rewardToken";

interface TokenBalanceDisplayProps {
  amount: string | null | undefined;
  symbol?: string | null;
  /** Compact chip vs. full awarded strip. */
  variant?: "chip" | "panel";
}

export const TokenBalanceDisplay = ({
  amount,
  symbol,
  variant = "panel",
}: TokenBalanceDisplayProps) => {
  const formatted = formatWholeTokenDisplay(amount ?? "0");
  const ticker = (symbol?.trim() || "tokens").toUpperCase();

  if (variant === "chip") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/12 px-2.5 py-0.5 text-xs font-semibold text-secondary">
        <IconCoin className="size-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums tracking-tight">{formatted}</span>
        <span className="font-medium opacity-80">{ticker}</span>
      </span>
    );
  }

  return (
    <div
      className="token-balance-panel flex items-center gap-3 rounded-xl border border-secondary/25 bg-gradient-to-r from-secondary/12 via-secondary/6 to-transparent px-3 py-2.5"
      role="status"
      aria-label={`${formatted} ${ticker} enviados`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-content shadow-sm">
        <IconCoin className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-secondary/80">
          Saldo enviado
        </p>
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight">
          <span className="text-xl font-semibold tabular-nums tracking-tight text-base-content">
            {formatted}
          </span>
          <span className="text-sm font-semibold text-secondary">{ticker}</span>
        </p>
      </div>
      <span className="badge badge-ghost badge-sm shrink-0 border-secondary/20 text-secondary">
        Enviado
      </span>
    </div>
  );
};
