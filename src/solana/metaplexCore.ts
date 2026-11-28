import { Keypair, PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  type KeypairSigner,
  type TransactionBuilder,
  type Umi,
} from "@metaplex-foundation/umi";
import {
  create,
  createCollection,
  fetchAssetsByCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";

export type CoreBuiltIxs = {
  ixs: TransactionInstruction[];
  firmante: Keypair;
  direccion: string;
};

export type CoreAssetDatos = {
  achievementId: string;
  student: string;
  teacher: string;
  courseId?: string | null;
  title: string;
};

export type CoreEmitido = {
  direccion: string;
  owner: string;
  achievementId: string;
  student: string;
  teacher: string;
};

export const crearUmi = (endpoint: string): Umi => createUmi(endpoint).use(mplCore());

function aWeb3(builder: TransactionBuilder, cuentaNueva: KeypairSigner): CoreBuiltIxs {
  return {
    ixs: builder.getInstructions().map(toWeb3JsInstruction),
    firmante: Keypair.fromSecretKey(cuentaNueva.secretKey),
    direccion: cuentaNueva.publicKey.toString(),
  };
}

/** Collection of classroom NFT achievements. Teacher pays and is update authority. */
export function ixsColeccion(
  umi: Umi,
  teacher: PublicKey,
  nombre: string,
  uri: string,
): CoreBuiltIxs {
  const autoridad = createNoopSigner(publicKey(teacher.toBase58()));
  const coleccion = generateSigner(umi);
  return aWeb3(
    createCollection(umi, {
      collection: coleccion,
      name: nombre,
      uri,
      payer: autoridad,
      updateAuthority: autoridad.publicKey,
    }),
    coleccion,
  );
}

/**
 * Core Asset for one achievement:
 * - owner: student wallet
 * - authority/payer: teacher
 * - Attributes link the asset to the on-chain achievement
 * - PermanentFreezeDelegate starts frozen (teacher UpdateAuthority can thaw)
 */
export function ixsCertificado(
  umi: Umi,
  teacher: PublicKey,
  coleccion: string,
  student: PublicKey,
  datos: CoreAssetDatos,
  uri: string,
): CoreBuiltIxs {
  const autoridad = createNoopSigner(publicKey(teacher.toBase58()));
  const asset = generateSigner(umi);
  const attributeList = [
    { key: "achievement_id", value: datos.achievementId },
    { key: "student", value: datos.student },
    { key: "teacher", value: datos.teacher },
  ];
  if (datos.courseId) {
    attributeList.push({ key: "course_id", value: datos.courseId });
  }

  const name =
    datos.title.trim().length > 32 ? `${datos.title.trim().slice(0, 29)}...` : datos.title.trim();

  return aWeb3(
    create(umi, {
      asset,
      collection: {
        publicKey: publicKey(coleccion),
        oracles: [],
        lifecycleHooks: [],
      },
      owner: publicKey(student.toBase58()),
      authority: autoridad,
      payer: autoridad,
      name: name || "Logro",
      uri,
      plugins: [
        { type: "Attributes", attributeList },
        {
          type: "PermanentFreezeDelegate",
          frozen: true,
          authority: { type: "UpdateAuthority" },
        },
      ],
    }),
    asset,
  );
}

/** Read assets in the collection (getProgramAccounts via Core SDK). */
export async function leerEmitidos(umi: Umi, coleccion: string): Promise<CoreEmitido[]> {
  const assets = await fetchAssetsByCollection(umi, publicKey(coleccion));
  return assets.map((asset) => {
    const attr = Object.fromEntries(
      (asset.attributes?.attributeList ?? []).map((a) => [a.key, a.value]),
    );
    return {
      direccion: asset.publicKey.toString(),
      owner: asset.owner.toString(),
      achievementId: attr.achievement_id ?? "",
      student: attr.student ?? "",
      teacher: attr.teacher ?? "",
    };
  });
}
