import { Keypair, PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  some,
  type KeypairSigner,
  type TransactionBuilder,
  type Umi,
} from "@metaplex-foundation/umi";
import { createCollection, mplCore } from "@metaplex-foundation/mpl-core";
import {
  createTreeV2,
  fetchTreeConfigFromSeeds,
  mintV2,
  mplBubblegum,
  parseLeafFromMintV2Transaction,
} from "@metaplex-foundation/mpl-bubblegum";
import { dasApi, type DasApiInterface } from "@metaplex-foundation/digital-asset-standard-api";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";

export type CnftBuiltIxs = {
  ixs: TransactionInstruction[];
  firmante: Keypair;
  direccion: string;
};

export type CnftTreeInfo = {
  capacidad: number;
  emitidos: number;
  publico: boolean;
  creador: string;
};

export type CnftEmitido = {
  direccion: string;
  owner: string;
  name: string;
};

export const crearUmi = (endpoint: string): Umi =>
  createUmi(endpoint).use(mplCore()).use(mplBubblegum()).use(dasApi());

const das = (umi: Umi) => umi.rpc as unknown as DasApiInterface;

const teacherUmi = (teacher: PublicKey) => createNoopSigner(publicKey(teacher.toBase58()));

const aWeb3 = (builder: TransactionBuilder) =>
  builder.getInstructions().map(toWeb3JsInstruction);

const firmanteFrom = (cuentaNueva: KeypairSigner) =>
  Keypair.fromSecretKey(cuentaNueva.secretKey);

function truncateName(title: string): string {
  const trimmed = title.trim() || "Logro";
  return trimmed.length > 32 ? `${trimmed.slice(0, 29)}...` : trimmed;
}

/** Core collection with BubblegumV2 plugin — required to group Bubblegum V2 cNFTs. */
export function ixsColeccion(
  umi: Umi,
  teacher: PublicKey,
  nombre: string,
  uri: string,
): CnftBuiltIxs {
  const autoridad = teacherUmi(teacher);
  const coleccion = generateSigner(umi);
  const ixs = aWeb3(
    createCollection(umi, {
      collection: coleccion,
      name: nombre,
      uri,
      payer: autoridad,
      updateAuthority: autoridad.publicKey,
      plugins: [{ type: "BubblegumV2" }],
    }),
  );
  return {
    ixs,
    firmante: firmanteFrom(coleccion),
    direccion: coleccion.publicKey.toString(),
  };
}

/**
 * Public Merkle tree (mentor creates once and shares the address).
 * Capacity = 2^depth leaves. Depth 14 / buffer 64 → 16,384 cNFTs.
 */
export async function ixsArbol(
  umi: Umi,
  teacher: PublicKey,
  profundidad = 14,
  buffer = 64,
): Promise<CnftBuiltIxs> {
  const autoridad = teacherUmi(teacher);
  const arbol = generateSigner(umi);
  const builder = await createTreeV2(umi, {
    merkleTree: arbol,
    maxDepth: profundidad,
    maxBufferSize: buffer,
    public: true,
    payer: autoridad,
    treeCreator: autoridad,
  });
  return {
    ixs: aWeb3(builder),
    firmante: firmanteFrom(arbol),
    direccion: arbol.publicKey.toString(),
  };
}

/** Read tree capacity, minted count, and whether it is public. */
export async function infoArbol(umi: Umi, arbol: string): Promise<CnftTreeInfo> {
  const c = await fetchTreeConfigFromSeeds(umi, { merkleTree: publicKey(arbol) });
  return {
    capacidad: Number(c.totalMintCapacity),
    emitidos: Number(c.numMinted),
    publico: c.isPublic,
    creador: c.treeCreator.toString(),
  };
}

/** Validate that this wallet can mint into the tree and space remains. */
export async function validarArbol(
  umi: Umi,
  arbol: string,
  wallet: string,
): Promise<CnftTreeInfo> {
  let info: CnftTreeInfo;
  try {
    info = await infoArbol(umi, arbol.trim());
  } catch {
    throw new Error("Esa dirección no es un árbol de Bubblegum en esta red.");
  }
  if (!info.publico && info.creador !== wallet) {
    throw new Error("El árbol no es público y tu wallet no es su creador.");
  }
  if (info.emitidos >= info.capacidad) {
    throw new Error("El árbol está lleno.");
  }
  return info;
}

/**
 * Mint a cNFT leaf for one achievement:
 * - leafOwner: student wallet
 * - collection authority / payer: teacher
 * - no new account keypair (compressed leaf)
 */
export function ixsCertificado(
  umi: Umi,
  teacher: PublicKey,
  arbol: string,
  coleccion: string,
  student: PublicKey,
  title: string,
  uri: string,
): TransactionInstruction[] {
  const autoridad = teacherUmi(teacher);
  return aWeb3(
    mintV2(umi, {
      payer: autoridad,
      treeCreatorOrDelegate: autoridad,
      collectionAuthority: autoridad,
      leafOwner: publicKey(student.toBase58()),
      merkleTree: publicKey(arbol),
      coreCollection: publicKey(coleccion),
      metadata: {
        name: truncateName(title),
        uri,
        sellerFeeBasisPoints: 0,
        collection: some(publicKey(coleccion)),
        creators: [],
      },
    }),
  );
}

/** Asset id of the minted cNFT, parsed from the confirmed mintV2 transaction. */
export async function idDesdeTransaccion(
  umi: Umi,
  firma: string,
  intentos = 6,
): Promise<string | null> {
  for (let i = 0; i < intentos; i++) {
    try {
      const leaf = await parseLeafFromMintV2Transaction(umi, base58.serialize(firma));
      return leaf.id.toString();
    } catch {
      if (i + 1 < intentos) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
  return null;
}

/** cNFTs in the collection via DAS API (requires a DAS-capable RPC such as Helius). */
export async function leerEmitidos(umi: Umi, coleccion: string): Promise<CnftEmitido[]> {
  let resultado;
  try {
    resultado = await das(umi).getAssetsByGroup({
      groupKey: "collection",
      groupValue: coleccion,
      limit: 1000,
    });
  } catch {
    throw new Error(
      "No se pudo consultar la DAS API. Revisa VITE_SOLANA_RPC_URL, la red Devnet y los límites de tu proveedor.",
    );
  }
  return resultado.items.map((asset) => ({
    direccion: asset.id.toString(),
    owner: asset.ownership.owner.toString(),
    name: asset.content?.metadata?.name ?? "",
  }));
}
