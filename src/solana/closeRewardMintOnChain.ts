import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findRewardConfigPda } from "./pdas";
import { TOKEN_PROGRAM_ID } from "./rewardToken";

const LOG = "[ScholarFi Achievement Vault]";

export type CloseRewardMintOnChainResult = {
  configPda: PublicKey;
  mint: PublicKey;
  mintId: bigint;
  signature?: string;
};

/**
 * Closes `RewardConfig`. Token-2022 mints with zero supply are also closed;
 * classic SPL mints are left orphaned so a new versioned mint can be created.
 */
export async function closeRewardMintOnChain(
  wallet: AnchorWallet,
  params: { mint: PublicKey; mintId: bigint },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CloseRewardMintOnChainResult> {
  const teacher = wallet.publicKey;
  const configPda = findRewardConfigPda(teacher);

  console.info(`${LOG} closeRewardMintOnChain: start`, {
    teacher: teacher.toBase58(),
    mint: params.mint.toBase58(),
    mintId: params.mintId.toString(),
    configPda: configPda.toBase58(),
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  // Classic orphan closes ignore mint_id for the mint PDA; Token-2022 closes need it.
  const mintIdArg = params.mintId < 0n ? 0n : params.mintId;

  const signature = await program.methods
    .closeRewardMint(new BN(mintIdArg.toString()))
    .accounts({
      teacher,
      rewardConfig: configPda,
      rewardMint: params.mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const exists = await connection.getAccountInfo(configPda);
        if (!exists) {
          console.warn(
            `${LOG} closeRewardMintOnChain: duplicate tx detected, config gone — treating as success`,
          );
          return "";
        }
      }
      throw error;
    });

  console.info(`${LOG} closeRewardMintOnChain: confirmed`, { signature: signature || null });

  return {
    configPda,
    mint: params.mint,
    mintId: mintIdArg,
    signature: signature || undefined,
  };
}
