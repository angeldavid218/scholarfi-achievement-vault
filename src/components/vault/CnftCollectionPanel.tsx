import { useState } from "react";
import type { CnftConfig } from "../../solana/cnftConfig";
import type { CnftTreeInfo } from "../../solana/cnftBubblegum";
import { FormField } from "../ui/FormField";
import { IconNftHex, IconPlusCircle } from "../ui/icons";

const EXPLORER_CLUSTER_QUERY = "cluster=devnet";
const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?${EXPLORER_CLUSTER_QUERY}`;

interface CnftCollectionPanelProps {
  config: CnftConfig | null;
  treeInfo: CnftTreeInfo | null;
  isMutating?: boolean;
  onValidateTree: (tree: string) => void | Promise<void>;
  onCreateCollection: (name: string, uri: string, tree: string) => void | Promise<void>;
  onUseExisting: (collection: string, uri: string, tree: string) => void;
  onCreatePublicTree: () => void | Promise<string | void>;
  onClear: () => void;
}

export const CnftCollectionPanel = ({
  config,
  treeInfo,
  isMutating = false,
  onValidateTree,
  onCreateCollection,
  onUseExisting,
  onCreatePublicTree,
  onClear,
}: CnftCollectionPanelProps) => {
  const [treeDraft, setTreeDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [uriDraft, setUriDraft] = useState("");
  const [existingCollection, setExistingCollection] = useState("");
  const [existingUri, setExistingUri] = useState("");
  const [validatedTree, setValidatedTree] = useState<string | null>(null);

  const activeTree = validatedTree ?? treeDraft.trim();

  const handleValidate = async () => {
    const tree = treeDraft.trim();
    if (!tree) {
      window.alert("Pega la dirección del árbol de Merkle público.");
      return;
    }
    await onValidateTree(tree);
    setValidatedTree(tree);
  };

  const handleCreate = async () => {
    const name = nameDraft.trim();
    const uri = uriDraft.trim();
    const tree = activeTree;
    if (!tree) {
      window.alert("Valida primero el árbol de Merkle.");
      return;
    }
    if (!name || !uri) {
      window.alert("Ingresa un nombre y una URL de metadata HTTPS pública.");
      return;
    }
    await onCreateCollection(name, uri, tree);
    setNameDraft("");
    setUriDraft("");
  };

  const handleUseExisting = () => {
    const collection = existingCollection.trim();
    const uri = existingUri.trim() || uriDraft.trim();
    const tree = activeTree;
    if (!tree) {
      window.alert("Valida primero el árbol de Merkle.");
      return;
    }
    if (!collection || !uri) {
      window.alert("Ingresa la dirección de la colección y la URL de metadata.");
      return;
    }
    onUseExisting(collection, uri, tree);
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
              NFT · Bubblegum V2 · cNFT
            </p>
            <h2 className="text-lg font-semibold text-base-content">
              Colección comprimida
            </h2>
            <p className="text-sm text-neutral">
              Árbol público compartido + colección Core con plugin BubblegumV2. Cada logro NFT
              agrega una hoja para el estudiante.
            </p>
          </div>
        </div>

        {config ? (
          <div className="space-y-3">
            <div className="rounded-box border border-accent/20 bg-gradient-to-br from-accent/10 via-base-100 to-transparent px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent/80">
                Configuración activa
              </p>
              <p className="mt-2 text-xs font-semibold text-neutral">Colección</p>
              <a
                className="link link-primary block break-all text-xs"
                href={explorerAddressUrl(config.collection)}
                target="_blank"
                rel="noreferrer"
              >
                {config.collection}
              </a>
              <p className="mt-2 text-xs font-semibold text-neutral">Árbol</p>
              <a
                className="link link-primary block break-all text-xs"
                href={explorerAddressUrl(config.tree)}
                target="_blank"
                rel="noreferrer"
              >
                {config.tree}
              </a>
              {treeInfo ? (
                <p className="mt-2 text-xs text-neutral">
                  {treeInfo.publico ? "Árbol público" : "Árbol propio"}:{" "}
                  {treeInfo.emitidos.toLocaleString("es-MX")} de{" "}
                  {treeInfo.capacidad.toLocaleString("es-MX")} hojas usadas.
                </p>
              ) : null}
              <p className="mt-2 break-all text-xs text-neutral">URI: {config.uri}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs w-fit"
              disabled={isMutating}
              onClick={onClear}
            >
              Configurar otra colección o árbol
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <FormField id="cnft-tree" label="Árbol de Merkle (dirección)">
              <input
                id="cnft-tree"
                className="input input-bordered w-full"
                placeholder="Dirección del árbol público de la sesión"
                value={treeDraft}
                onChange={(event) => {
                  setTreeDraft(event.target.value);
                  setValidatedTree(null);
                }}
                spellCheck={false}
                disabled={isMutating}
              />
            </FormField>
            <button
              type="button"
              className="btn btn-outline btn-sm w-fit"
              disabled={isMutating || !treeDraft.trim()}
              onClick={() => void handleValidate()}
            >
              {isMutating ? "Validando…" : "Validar árbol"}
            </button>
            {treeInfo && validatedTree ? (
              <p className="text-xs text-neutral">
                Árbol {treeInfo.publico ? "público" : "propio"}:{" "}
                {treeInfo.emitidos.toLocaleString("es-MX")} de{" "}
                {treeInfo.capacidad.toLocaleString("es-MX")} hojas usadas.
              </p>
            ) : null}

            <FormField id="cnft-collection-name" label="Nombre de la colección">
              <input
                id="cnft-collection-name"
                className="input input-bordered w-full"
                placeholder="ej. Logros del aula"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                disabled={isMutating || !validatedTree}
              />
            </FormField>
            <FormField id="cnft-collection-uri" label="URL de metadata (JSON público)">
              <input
                id="cnft-collection-uri"
                className="input input-bordered w-full"
                placeholder="https://raw.githubusercontent.com/.../metadata.json"
                value={uriDraft}
                onChange={(event) => setUriDraft(event.target.value)}
                spellCheck={false}
                disabled={isMutating || !validatedTree}
              />
              <p className="mt-1 text-xs text-neutral">
                Un enlace github.com/…/blob/… se convierte a raw. Debe ser HTTPS público. Requiere
                RPC con DAS (Helius Devnet) para listar cNFTs.
              </p>
            </FormField>
            <button
              type="button"
              className="btn btn-accent btn-sm w-fit gap-2"
              disabled={isMutating || !validatedTree}
              onClick={() => void handleCreate()}
            >
              <IconPlusCircle className="size-4" />
              {isMutating ? "Creando…" : "Crear colección BubblegumV2"}
            </button>

            <details className="rounded-box border border-base-300/70 bg-base-200/30 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-base-content">
                Usar una colección que ya creaste
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <FormField id="cnft-collection-existing" label="Dirección de la colección">
                  <input
                    id="cnft-collection-existing"
                    className="input input-bordered input-sm w-full"
                    value={existingCollection}
                    onChange={(event) => setExistingCollection(event.target.value)}
                    spellCheck={false}
                    disabled={isMutating || !validatedTree}
                  />
                </FormField>
                <FormField id="cnft-collection-existing-uri" label="URI de metadata">
                  <input
                    id="cnft-collection-existing-uri"
                    className="input input-bordered input-sm w-full"
                    placeholder="Usa la misma URI o pégala aquí"
                    value={existingUri}
                    onChange={(event) => setExistingUri(event.target.value)}
                    spellCheck={false}
                    disabled={isMutating || !validatedTree}
                  />
                </FormField>
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-fit"
                  disabled={
                    isMutating ||
                    !validatedTree ||
                    !existingCollection.trim() ||
                    !(existingUri.trim() || uriDraft.trim())
                  }
                  onClick={handleUseExisting}
                >
                  Usar esta colección
                </button>
              </div>
            </details>

            <details className="rounded-box border border-base-300/70 bg-base-200/30 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-base-content">
                Crear un árbol público (lo hace el mentor una vez)
              </summary>
              <p className="mt-2 text-xs text-neutral">
                Profundidad 14 y buffer 64: 16,384 cNFTs por ≈ 0.22 SOL de renta. Cualquier wallet
                podrá emitir en él.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm mt-3 w-fit"
                disabled={isMutating}
                onClick={() => {
                  void (async () => {
                    const tree = await onCreatePublicTree();
                    if (typeof tree === "string" && tree.trim()) {
                      setTreeDraft(tree.trim());
                      setValidatedTree(tree.trim());
                    }
                  })();
                }}
              >
                {isMutating ? "Creando…" : "Crear árbol público"}
              </button>
            </details>
          </div>
        )}
      </div>
    </section>
  );
};
