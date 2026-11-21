import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findCoursePda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type UpdateCourseOnChainResult = {
  coursePda: PublicKey;
  signature?: string;
};

/**
 * Updates title/active on a teacher-owned Course via `update_course`.
 */
export async function updateCourseOnChain(
  wallet: AnchorWallet,
  params: {
    courseId: bigint;
    title: string;
    active: boolean;
  },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<UpdateCourseOnChainResult> {
  const teacher = wallet.publicKey;
  const title = params.title.trim();
  const titleBytes = new TextEncoder().encode(title);
  if (titleBytes.length === 0) {
    throw new Error("Course title is required");
  }
  if (titleBytes.length > 64) {
    throw new Error("Course title exceeds 64 UTF-8 bytes");
  }

  const courseIdBn = new BN(params.courseId.toString());
  const coursePda = findCoursePda(teacher, params.courseId);

  console.info(`${LOG} updateCourseOnChain: start`, {
    courseId: courseIdBn.toString(),
    coursePda: coursePda.toBase58(),
    active: params.active,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .updateCourse(courseIdBn, title, params.active)
    .accounts({
      teacher,
      course: coursePda,
    })
    .rpc();

  console.info(`${LOG} updateCourseOnChain: confirmed`, { signature });

  return { coursePda, signature };
}

export type CloseCourseOnChainResult = {
  coursePda: PublicKey;
  signature?: string;
};

/**
 * Closes a Course PDA and returns rent to the teacher via `close_course`.
 */
export async function closeCourseOnChain(
  wallet: AnchorWallet,
  courseId: bigint,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CloseCourseOnChainResult> {
  const teacher = wallet.publicKey;
  const courseIdBn = new BN(courseId.toString());
  const coursePda = findCoursePda(teacher, courseId);

  console.info(`${LOG} closeCourseOnChain: start`, {
    courseId: courseIdBn.toString(),
    coursePda: coursePda.toBase58(),
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .closeCourse(courseIdBn)
    .accounts({
      teacher,
      course: coursePda,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const stillExists = await connection.getAccountInfo(coursePda);
        if (!stillExists) {
          console.warn(
            `${LOG} closeCourseOnChain: duplicate tx detected, course already closed`,
            { coursePda: coursePda.toBase58() },
          );
          return "";
        }
      }
      throw error;
    });

  return { coursePda, signature: signature || undefined };
}
