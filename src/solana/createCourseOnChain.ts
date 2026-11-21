import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findCoursePda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type CreateCourseOnChainResult = {
  courseId: BN;
  coursePda: PublicKey;
  signature?: string;
};

function nextCourseIdStorageKey(teacher: PublicKey): string {
  return `scholarfi_next_course_id_${teacher.toBase58()}`;
}

function readNextCourseId(teacher: PublicKey): bigint {
  if (typeof window === "undefined") return 0n;
  const raw = window.localStorage.getItem(nextCourseIdStorageKey(teacher));
  if (!raw) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

function writeNextCourseId(teacher: PublicKey, next: bigint): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(nextCourseIdStorageKey(teacher), next.toString());
}

/**
 * Creates a teacher-owned `Course` PDA via `create_course`.
 * `course_id` advances from localStorage and skips occupied PDAs.
 */
export async function createCourseOnChain(
  wallet: AnchorWallet,
  params: { title: string },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CreateCourseOnChainResult> {
  const teacher = wallet.publicKey;
  const title = params.title.trim();
  const titleBytes = new TextEncoder().encode(title);
  if (titleBytes.length === 0) {
    throw new Error("Course title is required");
  }
  if (titleBytes.length > 64) {
    throw new Error("Course title exceeds 64 UTF-8 bytes");
  }

  let nextCourseId = readNextCourseId(teacher);
  let courseIdBn = new BN(nextCourseId.toString());
  let coursePda = findCoursePda(teacher, nextCourseId);

  while (await connection.getAccountInfo(coursePda)) {
    nextCourseId += 1n;
    courseIdBn = new BN(nextCourseId.toString());
    coursePda = findCoursePda(teacher, nextCourseId);
  }

  console.info(`${LOG} createCourseOnChain: start`, {
    teacher: teacher.toBase58(),
    courseId: courseIdBn.toString(),
    coursePda: coursePda.toBase58(),
    title,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .createCourse(courseIdBn, title)
    .accounts({
      teacher,
      course: coursePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
    .catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been processed")) {
        const exists = await connection.getAccountInfo(coursePda);
        if (exists) {
          console.warn(
            `${LOG} createCourseOnChain: duplicate tx detected, course exists — treating as success`,
            { coursePda: coursePda.toBase58() },
          );
          return "";
        }
      }
      throw error;
    });

  writeNextCourseId(teacher, nextCourseId + 1n);

  console.info(`${LOG} createCourseOnChain: confirmed`, { signature: signature || null });

  return {
    courseId: courseIdBn,
    coursePda,
    signature: signature || undefined,
  };
}
