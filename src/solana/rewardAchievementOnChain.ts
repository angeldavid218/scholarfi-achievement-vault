import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import {
  findAchievementPda,
  findRewardConfigPda,
  findRewardMintPda,
  findRewardReceiptPda,
  findStudentListPda,
} from "./pdas";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  findStudentRewardAta,
  parseRewardAmount,
  TOKEN_PROGRAM_ID,
} from "./rewardToken";

const LOG = "[ScholarFi Achievement Vault]";

export type RewardAchievementOnChainResult = {
  achievementPda: PublicKey;
  receiptPda: PublicKey;
  studentAta: PublicKey;
  mint: PublicKey;
  amount: bigint;
  signature?: string;
};

/**
 * Mints `amount` classroom tokens into the student's ATA for an existing
 * token achievement. A second call fails because the receipt PDA already exists.
 */
export async function rewardAchievementOnChain(
  wallet: AnchorWallet,
  params: {
    student: PublicKey;
    achievementId: bigint;
    amount: bigint | string;
    mintId: bigint;
    achievementPda?: PublicKey;
  },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<RewardAchievementOnChainResult> {
  const teacher = wallet.publicKey;
  const amount =
    typeof params.amount === "bigint" ? params.amount : parseRewardAmount(params.amount);
  if (amount === null || amount < 1n) {
    throw new Error("Reward amount must be a whole number between 1 and 1000000000 tokens");
  }

  const achievementPda =
    params.achievementPda ?? findAchievementPda(teacher, params.student, params.achievementId);
  const mint = findRewardMintPda(teacher, params.mintId);
  const studentAta = findStudentRewardAta(mint, params.student);
  const receiptPda = findRewardReceiptPda(achievementPda);

  console.info(`${LOG} rewardAchievementOnChain: start`, {
    teacher: teacher.toBase58(),
    student: params.student.toBase58(),
    achievementId: params.achievementId.toString(),
    mintId: params.mintId.toString(),
    achievementPda: achievementPda.toBase58(),
    mint: mint.toBase58(),
    studentAta: studentAta.toBase58(),
    amount: amount.toString(),
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .rewardAchievement(
      new BN(params.achievementId.toString()),
      new BN(amount.toString()),
      new BN(params.mintId.toString()),
    )
    .accounts({
      teacher,
      student: params.student,
      studentList: findStudentListPda(teacher),
      achievement: achievementPda,
      rewardConfig: findRewardConfigPda(teacher),
      rewardMint: mint,
      rewardReceipt: receiptPda,
      studentTokenAccount: studentAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const exists = await connection.getAccountInfo(receiptPda);
        if (exists) {
          console.warn(
            `${LOG} rewardAchievementOnChain: duplicate tx detected, receipt exists — treating as success`,
            { receiptPda: receiptPda.toBase58() },
          );
          return "";
        }
      }
      throw error;
    });

  console.info(`${LOG} rewardAchievementOnChain: confirmed`, { signature: signature || null });

  return {
    achievementPda,
    receiptPda,
    studentAta,
    mint,
    amount,
    signature: signature || undefined,
  };
}
