export type CnftConfig = {
  tree: string;
  collection: string;
  uri: string;
};

function storageKey(teacherWallet: string): string {
  return `scholarfi_cnft_config_${teacherWallet}`;
}

export function readCnftConfig(teacherWallet: string): CnftConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(teacherWallet));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const { tree, collection, uri } = parsed as Record<string, unknown>;
    if (
      typeof tree !== "string" ||
      typeof collection !== "string" ||
      typeof uri !== "string"
    ) {
      return null;
    }
    if (!tree.trim() || !collection.trim() || !uri.trim()) return null;
    return {
      tree: tree.trim(),
      collection: collection.trim(),
      uri: uri.trim(),
    };
  } catch {
    return null;
  }
}

export function writeCnftConfig(teacherWallet: string, config: CnftConfig | null): void {
  if (typeof window === "undefined") return;
  const key = storageKey(teacherWallet);
  if (config) {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        tree: config.tree.trim(),
        collection: config.collection.trim(),
        uri: config.uri.trim(),
      }),
    );
  } else {
    window.localStorage.removeItem(key);
  }
}

/**
 * Normalize a public metadata URL. GitHub `/blob/` links become `raw.githubusercontent.com`.
 */
export function uriMetadata(valor: string): string {
  let uri = valor.trim();
  const blob = uri.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  if (blob) {
    uri = `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
  }
  if (!/^https:\/\/\S+$/.test(uri)) {
    throw new Error("La metadata debe ser una URL https pública.");
  }
  if (uri.length > 200) {
    throw new Error("La URL de la metadata es demasiado larga (máximo 200 caracteres).");
  }
  return uri;
}

function assetMapStorageKey(teacherWallet: string): string {
  return `scholarfi_cnft_assets_${teacherWallet}`;
}

/** Maps achievement PDA → cNFT asset id (client-side only). */
export function readCnftAssetMap(teacherWallet: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(assetMapStorageKey(teacherWallet));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function rememberCnftAsset(
  teacherWallet: string,
  achievementPda: string,
  assetAddress: string,
): void {
  if (typeof window === "undefined") return;
  const map = readCnftAssetMap(teacherWallet);
  map[achievementPda] = assetAddress;
  window.localStorage.setItem(assetMapStorageKey(teacherWallet), JSON.stringify(map));
}
