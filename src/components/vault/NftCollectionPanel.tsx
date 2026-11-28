import { useState } from "react";
import type { NftCollectionConfig } from "../../solana/nftCollectionConfig";
import { FormField } from "../ui/FormField";
import { IconNftHex, IconPlusCircle } from "../ui/icons";

const EXPLORER_CLUSTER_QUERY = "cluster=devnet";
const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?${EXPLORER_CLUSTER_QUERY}`;

interface NftCollectionPanelProps {
  config: NftCollectionConfig | null;
  isMutating?: boolean;
  onCreateCollection: (name: string, uri: string) => void | Promise<void>;
  onUseExisting: (collection: string, uri: string) => void;
  onClear: () => void;
}

export const NftCollectionPanel = ({
  config,
  isMutating = false,
  onCreateCollection,
  onUseExisting,
  onClear,
}: NftCollectionPanelProps) => {
  const [nameDraft, setNameDraft] = useState("");
  const [uriDraft, setUriDraft] = useState("");
  const [existingCollection, setExistingCollection] = useState("");
  const [existingUri, setExistingUri] = useState("");

  const handleCreate = async () => {
    const name = nameDraft.trim();
    const uri = uriDraft.trim();
    if (!name || !uri) {
      window.alert("Ingresa un nombre y una URL de metadata HTTPS pública.");
      return;
    }
    await onCreateCollection(name, uri);
    setNameDraft("");
    setUriDraft("");
  };

  const handleUseExisting = () => {
    const collection = existingCollection.trim();
    const uri = existingUri.trim() || uriDraft.trim();
    if (!collection || !uri) {
      window.alert("Ingresa la dirección de la colección y la URL de metadata.");
      return;
    }
    onUseExisting(collection, uri);
    setExistingCollection("");
    setExistingUri("");
  };

  return (
    <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
      <div className="card-body gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-accent/10 p-2 text-accent">
            <IconNftHex className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
              NFT · Metaplex Core
            </p>
            <h2 className="text-lg font-semibold text-base-content">Colección de logros</h2>
            <p className="text-sm text-neutral">
              Una colección Core por teacher. Cada logro NFT crea un Asset para el estudiante.
            </p>
          </div>
        </div>

        {config ? (
          <div className="space-y-3">
            <div className="rounded-box border border-accent/20 bg-gradient-to-br from-accent/10 via-base-100 to-transparent px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent/80">
                Colección activa
              </p>
              <a
                className="link link-primary mt-1 block break-all text-xs"
                href={explorerAddressUrl(config.collection)}
                target="_blank"
                rel="noreferrer"
              >
                {config.collection}
              </a>
              <p className="mt-2 break-all text-xs text-neutral">URI: {config.uri}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs w-fit"
              disabled={isMutating}
              onClick={onClear}
            >
              Configurar otra colección
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <FormField id="nft-collection-name" label="Nombre de la colección">
              <input
                id="nft-collection-name"
                className="input input-bordered w-full"
                placeholder="ej. Logros del aula"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                disabled={isMutating}
              />
            </FormField>
            <FormField id="nft-collection-uri" label="URL de metadata (JSON público)">
              <input
                id="nft-collection-uri"
                className="input input-bordered w-full"
                placeholder="https://raw.githubusercontent.com/.../metadata.json"
                value={uriDraft}
                onChange={(event) => setUriDraft(event.target.value)}
                spellCheck={false}
                disabled={isMutating}
              />
              <p className="mt-1 text-xs text-neutral">
                Un enlace github.com/…/blob/… se convierte a raw. Debe ser HTTPS público.
              </p>
            </FormField>
            <button
              type="button"
              className="btn btn-accent btn-sm w-fit gap-2"
              disabled={isMutating}
              onClick={() => void handleCreate()}
            >
              <IconPlusCircle className="size-4" />
              {isMutating ? "Creando…" : "Crear colección"}
            </button>

            <details className="rounded-box border border-base-300/70 bg-base-200/30 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-base-content">
                Usar una colección que ya creaste
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <FormField id="nft-collection-existing" label="Dirección de la colección">
                  <input
                    id="nft-collection-existing"
                    className="input input-bordered input-sm w-full"
                    value={existingCollection}
                    onChange={(event) => setExistingCollection(event.target.value)}
                    spellCheck={false}
                    disabled={isMutating}
                  />
                </FormField>
                <FormField id="nft-collection-existing-uri" label="URI de metadata">
                  <input
                    id="nft-collection-existing-uri"
                    className="input input-bordered input-sm w-full"
                    placeholder="Usa la misma URI o pégala aquí"
                    value={existingUri}
                    onChange={(event) => setExistingUri(event.target.value)}
                    spellCheck={false}
                    disabled={isMutating}
                  />
                </FormField>
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-fit"
                  disabled={isMutating}
                  onClick={handleUseExisting}
                >
                  Usar esta colección
                </button>
              </div>
            </details>
          </div>
        )}
      </div>
    </section>
  );
};
