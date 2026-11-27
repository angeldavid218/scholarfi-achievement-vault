import { useState } from "react";
import type { TeacherRewardMint } from "../../types/achievement";
import { FormField } from "../ui/FormField";
import { IconPlusCircle, IconTrophy } from "../ui/icons";

interface RewardMintPanelProps {
  rewardMint: TeacherRewardMint | null;
  syncStatus: "idle" | "pending" | "ready" | "error";
  isMutating?: boolean;
  onCreateMint: (name: string, symbol: string) => void | Promise<void>;
  onReplaceMint: (name: string, symbol: string) => void | Promise<void>;
}

export const RewardMintPanel = ({
  rewardMint,
  syncStatus,
  isMutating = false,
  onCreateMint,
  onReplaceMint,
}: RewardMintPanelProps) => {
  const [nameDraft, setNameDraft] = useState("");
  const [symbolDraft, setSymbolDraft] = useState("");
  const [replaceOpen, setReplaceOpen] = useState(false);

  const handleCreate = async () => {
    const name = nameDraft.trim();
    const symbol = symbolDraft.trim();
    if (!name || !symbol) {
      window.alert("Ingresa un nombre y un símbolo para el token.");
      return;
    }
    await onCreateMint(name, symbol);
    setNameDraft("");
    setSymbolDraft("");
  };

  const handleReplace = async () => {
    const name = nameDraft.trim() || rewardMint?.name || "";
    const symbol = symbolDraft.trim() || rewardMint?.symbol || "";
    if (!name || !symbol) {
      window.alert("Ingresa un nombre y un símbolo para el nuevo token.");
      return;
    }
    const ok = window.confirm(
      "Esto cierra el token actual y crea uno Token-2022 nuevo. Los saldos del mint anterior no se migran. ¿Continuar?",
    );
    if (!ok) return;
    await onReplaceMint(name, symbol);
    setNameDraft("");
    setSymbolDraft("");
    setReplaceOpen(false);
  };

  const needsReplace = Boolean(rewardMint && !rewardMint.isToken2022);

  return (
    <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
      <div className="card-body gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-secondary/10 p-2 text-secondary">
            <IconTrophy className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
              Token
            </p>
            <h2 className="text-lg font-semibold text-base-content">Token del aula</h2>
            <p className="text-sm text-neutral">
              Un mint Token-2022 por teacher. Explorer muestra el nombre vía metadata en el mint.
            </p>
          </div>
        </div>

        {syncStatus === "pending" && !rewardMint ? (
          <p className="text-sm text-neutral">Buscando el token en cadena…</p>
        ) : null}

        {rewardMint ? (
          <div className="space-y-3">
            <div className="rounded-box border border-secondary/20 bg-gradient-to-br from-secondary/10 via-base-100 to-transparent px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-secondary/80">
                    Token activo
                  </p>
                  <p className="text-lg font-semibold leading-tight text-base-content">
                    {rewardMint.name}
                  </p>
                  <p className="text-sm text-neutral">
                    Símbolo{" "}
                    <span className="font-semibold tabular-nums text-secondary">
                      {rewardMint.symbol}
                    </span>
                    <span className="mx-1.5 text-base-300">·</span>
                    {rewardMint.decimals} decimales
                  </p>
                </div>
                <span
                  className={`badge badge-sm ${rewardMint.isToken2022 ? "badge-primary" : "badge-warning"}`}
                >
                  {rewardMint.isToken2022 ? "Token-2022" : "Legacy SPL"}
                </span>
              </div>
              <a
                className="link link-primary mt-2 block break-all text-xs"
                href={rewardMint.explorerAddressUrl}
                target="_blank"
                rel="noreferrer"
              >
                Mint: {rewardMint.mint}
              </a>
              {needsReplace ? (
                <p className="mt-2 text-xs text-warning">
                  Este mint es SPL clásico (Explorer: Unknown Token). Reemplázalo por Token-2022
                  para que Explorer muestre el nombre.
                </p>
              ) : null}
            </div>

            {needsReplace || replaceOpen ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <FormField id="reward-mint-replace-name" label="Nuevo nombre">
                    <input
                      id="reward-mint-replace-name"
                      className="input input-bordered w-full"
                      placeholder={rewardMint.name}
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                    />
                  </FormField>
                  <FormField id="reward-mint-replace-symbol" label="Símbolo">
                    <input
                      id="reward-mint-replace-symbol"
                      className="input input-bordered w-full"
                      placeholder={rewardMint.symbol}
                      value={symbolDraft}
                      onChange={(event) => setSymbolDraft(event.target.value)}
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  className="btn btn-warning btn-sm w-fit gap-2"
                  disabled={isMutating}
                  onClick={() => void handleReplace()}
                >
                  Reemplazar token
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-xs w-fit"
                disabled={isMutating}
                onClick={() => setReplaceOpen(true)}
              >
                Reemplazar token…
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <FormField id="reward-mint-name" label="Nombre">
                <input
                  id="reward-mint-name"
                  className="input input-bordered w-full"
                  placeholder="ej. MERIT"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                />
              </FormField>
              <FormField id="reward-mint-symbol" label="Símbolo">
                <input
                  id="reward-mint-symbol"
                  className="input input-bordered w-full"
                  placeholder="MERIT"
                  value={symbolDraft}
                  onChange={(event) => setSymbolDraft(event.target.value)}
                />
              </FormField>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm w-fit gap-2"
              disabled={isMutating || syncStatus === "pending"}
              onClick={() => void handleCreate()}
            >
              <IconPlusCircle className="size-4" />
              Crear token
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
