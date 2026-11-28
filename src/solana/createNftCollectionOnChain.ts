import { AnchorProvider } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Transaction, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  SCHOLARFI_LITE_CLUSTER_URL,
} from "../connection";
import { crearUmi, ixsColeccion } from "./metaplexCore";
import { uriMetadata, writeNftCollectionConfig } from "./nftCollectionConfig";

const LOG = "[ScholarFi Achievement Vault]";

export type CreateNftCollectionOnChainResult = {
  collection: string;
  uri: string;
  signature: string;
};

/**
 * Creates a Metaplex Core collection for the teacher's NFT achievements.
 * Persists `{ collection, uri }` in localStorage for later mints.
 */
export async function createNftCollectionOnChain(
  wallet: AnchorWallet,
  params: { name: string; uri: string },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CreateNftCollectionOnChainResult> {
  const teacher = wallet.publicKey;
  const name = params.name.trim();
  if (!name) {
    throw new Error("Collection name is required");
  }
  const uri = uriMetadata(params.uri);

  const umi = crearUmi(SCHOLARFI_LITE_CLUSTER_URL);
  const built = ixsColeccion(umi, teacher, name, uri);

  console.info(`${LOG} createNftCollectionOnChain: start`, {
    teacher: teacher.toBase58(),
    collection: built.direccion,
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

  writeNftCollectionConfig(teacher.toBase58(), {
    collection: built.direccion,
    uri,
  });

  console.info(`${LOG} createNftCollectionOnChain: confirmed`, {
    signature,
    collection: built.direccion,
  });

  return {
    collection: built.direccion,
    uri,
    signature,
  };
}
