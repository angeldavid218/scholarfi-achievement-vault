import { AnchorProvider } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Transaction, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  SCHOLARFI_LITE_CLUSTER_URL,
} from "../connection";
import { crearUmi, ixsArbol, ixsColeccion, validarArbol } from "./cnftBubblegum";
import { uriMetadata, writeCnftConfig, type CnftConfig } from "./cnftConfig";

const LOG = "[ScholarFi Achievement Vault]";

export type CreateCnftCollectionOnChainResult = {
  collection: string;
  tree: string;
  uri: string;
  signature: string;
};

export type CreatePublicTreeOnChainResult = {
  tree: string;
  signature: string;
  costoSol: number | null;
};

/**
 * Creates a Metaplex Core collection with the BubblegumV2 plugin.
 * Persists `{ tree, collection, uri }` in localStorage for later mints.
 */
export async function createCnftCollectionOnChain(
  wallet: AnchorWallet,
  params: { name: string; uri: string; tree: string },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CreateCnftCollectionOnChainResult> {
  const teacher = wallet.publicKey;
  const name = params.name.trim();
  if (!name) {
    throw new Error("Collection name is required");
  }
  const tree = params.tree.trim();
  if (!tree) {
    throw new Error("Merkle tree address is required");
  }

  const umi = crearUmi(SCHOLARFI_LITE_CLUSTER_URL);
  await validarArbol(umi, tree, teacher.toBase58());
  const uri = uriMetadata(params.uri);
  const built = ixsColeccion(umi, teacher, name, uri);

  console.info(`${LOG} createCnftCollectionOnChain: start`, {
    teacher: teacher.toBase58(),
    collection: built.direccion,
    tree,
    uri,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: teacher,
    blockhash,
    lastValidBlockHeight,
  }).add(...built.ixs);

  const signature = await provider.sendAndConfirm(tx, [built.firmante], {
    commitment: "confirmed",
  });

  const config: CnftConfig = {
    tree,
    collection: built.direccion,
    uri,
  };
  writeCnftConfig(teacher.toBase58(), config);

  console.info(`${LOG} createCnftCollectionOnChain: confirmed`, {
    signature,
    collection: built.direccion,
    tree,
  });

  return {
    collection: built.direccion,
    tree,
    uri,
    signature,
  };
}

/** Creates a public Bubblegum V2 tree (mentor demo). Depth 14 / buffer 64. */
export async function createPublicTreeOnChain(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CreatePublicTreeOnChainResult> {
  const teacher = wallet.publicKey;
  const umi = crearUmi(SCHOLARFI_LITE_CLUSTER_URL);
  const built = await ixsArbol(umi, teacher);

  console.info(`${LOG} createPublicTreeOnChain: start`, {
    teacher: teacher.toBase58(),
    tree: built.direccion,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });

  const before = await connection.getBalance(teacher, "confirmed").catch(() => null);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: teacher,
    blockhash,
    lastValidBlockHeight,
  }).add(...built.ixs);

  const signature = await provider.sendAndConfirm(tx, [built.firmante], {
    commitment: "confirmed",
  });
  const after = await connection.getBalance(teacher, "confirmed").catch(() => null);

  console.info(`${LOG} createPublicTreeOnChain: confirmed`, {
    signature,
    tree: built.direccion,
  });

  return {
    tree: built.direccion,
    signature,
    costoSol: before === null || after === null ? null : (before - after) / 1e9,
  };
}
