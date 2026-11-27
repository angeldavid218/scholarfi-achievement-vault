import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import type { TeacherRewardMint } from "../types/achievement";
import { findRewardConfigPda, resolveRewardMintId } from "./pdas";
import { TOKEN_PROGRAM_ID } from "./rewardToken";

type RewardConfigDecoded = {
  teacher: PublicKey;
  mint: PublicKey;
  decimals: number;
  name: string;
  symbol: string;
};

function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

/**
 * Reads the teacher's `RewardConfig`. Returns null when the classroom mint
 * has not been created yet.
 */
export async function fetchTeacherRewardMint(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<TeacherRewardMint | null> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);
  const configPda = findRewardConfigPda(wallet.publicKey);

  const accountNamespace = program.account as {
    rewardConfig?: {
      fetchNullable: (address: PublicKey) => Promise<RewardConfigDecoded | null>;
    };
  };
  if (!accountNamespace.rewardConfig) return null;

  const account = await accountNamespace.rewardConfig.fetchNullable(configPda);
  if (!account) return null;

  const mint = account.mint;
  const mintInfo = await connection.getAccountInfo(mint);
  const isToken2022 = mintInfo?.owner.equals(TOKEN_PROGRAM_ID) ?? false;
  const mintId = resolveRewardMintId(wallet.publicKey, mint);

  return {
    name: account.name,
    symbol: account.symbol,
    decimals: account.decimals,
    mint: mint.toBase58(),
    mintId,
    isToken2022,
    configPda: configPda.toBase58(),
    explorerAddressUrl: explorerAddressUrl(mint.toBase58()),
  };
}
