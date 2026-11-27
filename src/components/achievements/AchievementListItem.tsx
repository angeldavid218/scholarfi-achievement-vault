import { useState } from "react";
import type { AchievementDefinition } from "../../types/achievement";
import { AchievementTypeBadge } from "./AchievementTypeBadge";
import { TokenBalanceDisplay } from "./TokenBalanceDisplay";
import { IconNftHex, IconPencil, IconTrash, IconTrophy } from "../ui/icons";

interface AchievementListItemProps {
  achievement: AchievementDefinition;
  rewardSymbol?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendTokens?: (id: string, amount: string) => void;
  isSendingTokens?: boolean;
}

export const AchievementListItem = ({
  achievement,
  rewardSymbol = null,
  onEdit,
  onDelete,
  onSendTokens,
  isSendingTokens = false,
}: AchievementListItemProps) => {
  const [amount, setAmount] = useState("");
  const canSend = achievement.kind === "token" && !achievement.rewarded;
  const ticker = (rewardSymbol?.trim() || "tokens").toUpperCase();

  return (
    <div className="vault-row rounded-box border border-base-300/70 bg-base-100/80 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-row items-start gap-4 p-4">
        <div
          className={`avatar shrink-0 ${achievement.kind === "nft" ? "text-accent" : "text-secondary"}`}
          aria-hidden
        >
          <div
            className={`flex size-14 items-center justify-center rounded-xl ${
              achievement.kind === "nft" ? "bg-accent/15" : "bg-secondary/15"
            }`}
          >
            {achievement.kind === "nft" ? (
              <IconNftHex className="size-8" strokeWidth={1.6} />
            ) : (
              <IconTrophy className="size-8" strokeWidth={1.6} />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold capitalize text-base-content">
              {achievement.name}
            </h3>
            <AchievementTypeBadge kind={achievement.kind} />
            {achievement.courseTitle || achievement.courseId ? (
              <span className="badge badge-outline badge-sm">
                {achievement.courseTitle ?? `Curso #${achievement.courseId}`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-neutral">{achievement.description}</p>
          {achievement.explorerAddressUrl ? (
            <a
              className="link link-primary break-all text-xs"
              href={achievement.explorerAddressUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver en Explorer (PDA): {achievement.sampleAchievementPda}
            </a>
          ) : null}

          {achievement.kind === "token" && achievement.rewarded ? (
            <TokenBalanceDisplay
              amount={achievement.rewardAmount}
              symbol={rewardSymbol}
              variant="panel"
            />
          ) : null}

          {canSend ? (
            <div className="flex flex-wrap items-end gap-2 pt-0.5">
              <label className="form-control w-auto">
                <span className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-neutral">
                  Cantidad
                </span>
                <div className="join border border-base-300 bg-base-200/70">
                  <input
                    className="input input-sm join-item w-28 border-0 bg-transparent tabular-nums focus:outline-none"
                    inputMode="numeric"
                    placeholder="0"
                    aria-label={`Cantidad de ${ticker} para ${achievement.name}`}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  <span className="join-item flex items-center px-2.5 text-xs font-semibold text-secondary">
                    {ticker}
                  </span>
                </div>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isSendingTokens}
                onClick={() => onSendTokens?.(achievement.id, amount)}
              >
                {isSendingTokens ? "Enviando…" : "Enviar"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm text-neutral"
            aria-label="Editar logro"
            onClick={() => onEdit?.(achievement.id)}
          >
            <IconPencil className="size-5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm text-neutral"
            aria-label="Eliminar logro"
            onClick={() => onDelete?.(achievement.id)}
          >
            <IconTrash className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
