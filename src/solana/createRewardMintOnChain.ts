import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findRewardConfigPda, findRewardMintPda } from "./pdas";
import {
  MAX_REWARD_NAME_BYTES,
  MAX_REWARD_SYMBOL_BYTES,
  TOKEN_PROGRAM_ID,
  utf8ByteLength,
} from "./rewardToken";

const LOG = "[ScholarFi Achievement Vault]";

export type CreateRewardMintOnChainResult = {
  mint: PublicKey;
  configPda: PublicKey;
  mintId: bigint;
  signature?: string;
};

function nextMintIdStorageKey(teacher: PublicKey): string {
  return `scholarfi_next_reward_mint_id_${teacher.toBase58()}`;
}

function readNextMintId(teacher: PublicKey): bigint {
  if (typeof window === "undefined") return 0n;
  const raw = window.localStorage.getItem(nextMintIdStorageKey(teacher));
  if (!raw) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

function writeNextMintId(teacher: PublicKey, next: bigint): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(nextMintIdStorageKey(teacher), next.toString());
}

/**
 * Creates the teacher's Token-2022 classroom mint + `RewardConfig`.
 * The mint PDA is the mint / metadata / close authority.
 */
export async function createRewardMintOnChain(
  wallet: AnchorWallet,
  params: { name: string; symbol: string },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CreateRewardMintOnChainResult> {
  const teacher = wallet.publicKey;
  const name = params.name.trim();
  const symbol = params.symbol.trim();
  if (utf8ByteLength(name) === 0) {
    throw new Error("Token name is required");
  }
  if (utf8ByteLength(name) > MAX_REWARD_NAME_BYTES) {
    throw new Error(`Token name exceeds ${MAX_REWARD_NAME_BYTES} UTF-8 bytes`);
  }
  if (utf8ByteLength(symbol) === 0) {
    throw new Error("Token symbol is required");
  }
  if (utf8ByteLength(symbol) > MAX_REWARD_SYMBOL_BYTES) {
    throw new Error(`Token symbol exceeds ${MAX_REWARD_SYMBOL_BYTES} UTF-8 bytes`);
  }

  const configPda = findRewardConfigPda(teacher);
  if (await connection.getAccountInfo(configPda)) {
    throw new Error("Reward mint already exists. Close/replace it before creating a new one.");
  }

  let mintId = readNextMintId(teacher);
  let mint = findRewardMintPda(teacher, mintId);
  while (await connection.getAccountInfo(mint)) {
    mintId += 1n;
    mint = findRewardMintPda(teacher, mintId);
  }

  console.info(`${LOG} createRewardMintOnChain: start`, {
    teacher: teacher.toBase58(),
    mint: mint.toBase58(),
    mintId: mintId.toString(),
    configPda: configPda.toBase58(),
    name,
    symbol,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .createRewardMint(name, symbol, new BN(mintId.toString()))
    .accounts({
      teacher,
      rewardMint: mint,
      rewardConfig: configPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const exists = await connection.getAccountInfo(configPda);
        if (exists) {
          console.warn(
            `${LOG} createRewardMintOnChain: duplicate tx detected, mint exists — treating as success`,
            { mint: mint.toBase58() },
          );
          return "";
        }
      }
      throw error;
    });

  writeNextMintId(teacher, mintId + 1n);

  console.info(`${LOG} createRewardMintOnChain: confirmed`, { signature: signature || null });

  return {
    mint,
    configPda,
    mintId,
    signature: signature || undefined,
  };
}
