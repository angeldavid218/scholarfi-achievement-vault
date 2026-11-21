import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import type { AchievementKind } from "../types/achievement";
import { findCoursePda, findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

function mapAchievementType(kind: AchievementKind) {
  return kind === "nft" ? { nft: {} } : { token: {} };
}

export type UpdateAchievementOnChainResult = {
  achievementPda: PublicKey;
  signature?: string;
};

/**
 * Updates one on-chain Achievement account via `update_achievement`.
 * Pass `courseId` to link/relink a Course PDA; null clears the course link.
 */
export async function updateAchievementOnChain(
  wallet: AnchorWallet,
  params: {
    student: PublicKey;
    achievementId: bigint;
    achievementPda: PublicKey;
    title: string;
    kind: AchievementKind;
    courseId?: bigint | null;
  },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<UpdateAchievementOnChainResult> {
  const teacher = wallet.publicKey;
  const title = params.title.trim();
  const titleBytes = new TextEncoder().encode(title);
  if (titleBytes.length === 0) {
    throw new Error("Title is required");
  }
  if (titleBytes.length > 128) {
    throw new Error("Title exceeds 128 UTF-8 bytes");
  }

  const achievementIdBn = new BN(params.achievementId.toString());
  const studentListPda = findStudentListPda(teacher);
  const courseId =
    params.courseId === undefined || params.courseId === null ? null : params.courseId;
  const coursePda = courseId !== null ? findCoursePda(teacher, courseId) : null;
  const courseIdArg = courseId !== null ? new BN(courseId.toString()) : null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .updateAchievement(achievementIdBn, title, mapAchievementType(params.kind), courseIdArg)
    // Generic Idl typing rejects optional null accounts; runtime Anchor accepts null.
    .accounts({
      teacher,
      student: params.student,
      studentList: studentListPda,
      course: coursePda,
      achievement: params.achievementPda,
    } as never)
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const stillExists = await connection.getAccountInfo(params.achievementPda);
        if (stillExists) {
          console.warn(
            `${LOG} updateAchievementOnChain: duplicate tx detected, treating as success`,
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
