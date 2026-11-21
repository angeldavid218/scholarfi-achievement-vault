import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type DeleteAchievementOnChainResult = {
  achievementPda: PublicKey;
  signature?: string;
};

/**
 * Closes one on-chain Achievement account via `delete_achievement`.
 */
export async function deleteAchievementOnChain(
  wallet: AnchorWallet,
  params: {
    student: PublicKey;
    achievementId: bigint;
    achievementPda: PublicKey;
  },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<DeleteAchievementOnChainResult> {
  const teacher = wallet.publicKey;
  const achievementIdBn = new BN(params.achievementId.toString());
  const studentListPda = findStudentListPda(teacher);

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .deleteAchievement(achievementIdBn)
    .accounts({
      teacher,
      student: params.student,
      studentList: studentListPda,
      achievement: params.achievementPda,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const stillExists = await connection.getAccountInfo(params.achievementPda);
        if (!stillExists) {
          console.warn(
            `${LOG} deleteAchievementOnChain: duplicate tx detected, achievement already closed`,
            { achievementPda: params.achievementPda.toBase58() },
          );
          return "";
        }
      }
      throw error;
    });

  return {
    achievementPda: params.achievementPda,
    signature: signature || undefined,
  };
}
