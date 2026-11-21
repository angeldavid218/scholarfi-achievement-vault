import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findAchievementPda, findCoursePda, findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type RegisterAchievementUiKind = "nft" | "token";

export type RegisterAchievementOnChainResult = {
  achievementId: BN;
  achievementPda: PublicKey;
  studentListPda: PublicKey;
  coursePda?: PublicKey;
  signature?: string;
};

function nextAchievementIdStorageKey(teacher: PublicKey, student: PublicKey): string {
  return `scholarfi_next_achievement_id_${teacher.toBase58()}_${student.toBase58()}`;
}

function readNextAchievementId(teacher: PublicKey, student: PublicKey): bigint {
  if (typeof window === "undefined") return 0n;
  const raw = window.localStorage.getItem(nextAchievementIdStorageKey(teacher, student));
  if (!raw) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

function writeNextAchievementId(teacher: PublicKey, student: PublicKey, next: bigint): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    nextAchievementIdStorageKey(teacher, student),
    next.toString(),
  );
}

function mapAchievementType(kind: RegisterAchievementUiKind) {
  return kind === "nft" ? { nft: {} } : { token: {} };
}

/**
 * Creates an `Achievement` PDA for `(teacher, student, achievement_id)` via `register_achievement`.
 * `achievement_id` is chosen from localStorage per `(teacher, student)` and only advanced after success.
 * Pass `courseId` to link an optional Course PDA; omit / null for an unlinked achievement.
 */
export async function registerAchievementOnChain(
  wallet: AnchorWallet,
  params: {
    student: PublicKey;
    title: string;
    kind: RegisterAchievementUiKind;
    courseId?: bigint | null;
  },
  connection: Connection = createScholarFiLiteConnection(),
): Promise<RegisterAchievementOnChainResult> {
  const teacher = wallet.publicKey;
  const titleBytes = new TextEncoder().encode(params.title.trim());
  if (titleBytes.length === 0) {
    throw new Error("Title is required");
  }
  if (titleBytes.length > 128) {
    throw new Error("Title exceeds 128 UTF-8 bytes");
  }

  const studentListPda = findStudentListPda(teacher);
  const courseId =
    params.courseId === undefined || params.courseId === null ? null : params.courseId;
  const coursePda = courseId !== null ? findCoursePda(teacher, courseId) : null;
  const courseIdArg = courseId !== null ? new BN(courseId.toString()) : null;

  let nextAchievementId = readNextAchievementId(teacher, params.student);
  let achievementIdBn = new BN(nextAchievementId.toString());
  let achievementPda = findAchievementPda(teacher, params.student, nextAchievementId);

  // localStorage may be stale; walk forward until we find a free PDA on-chain.
  while (await connection.getAccountInfo(achievementPda)) {
    nextAchievementId += 1n;
    achievementIdBn = new BN(nextAchievementId.toString());
    achievementPda = findAchievementPda(teacher, params.student, nextAchievementId);
  }

  console.info(`${LOG} registerAchievementOnChain: start`, {
    rpc: connection.rpcEndpoint,
    teacher: teacher.toBase58(),
    student: params.student.toBase58(),
    achievementId: achievementIdBn.toString(),
    achievementPda: achievementPda.toBase58(),
    studentListPda: studentListPda.toBase58(),
    courseId: courseId?.toString() ?? null,
    coursePda: coursePda?.toBase58() ?? null,
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });

  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .registerAchievement(
      achievementIdBn,
      params.title.trim(),
      mapAchievementType(params.kind),
      courseIdArg,
    )
    // Generic Idl typing rejects optional null accounts; runtime Anchor accepts null.
    .accounts({
      teacher,
      student: params.student,
      studentList: studentListPda,
      course: coursePda,
      achievement: achievementPda,
      systemProgram: SystemProgram.programId,
    } as never)
    .rpc()
    .catch(async (e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      const isAlreadyProcessed = message.includes("already been processed");
      if (isAlreadyProcessed) {
        const exists = await connection.getAccountInfo(achievementPda);
        if (exists) {
          console.warn(
            `${LOG} registerAchievementOnChain: duplicate tx detected, but achievement exists — treating as success`,
            { achievementPda: achievementPda.toBase58() },
          );
          return "";
        }
      }
      throw e;
    });

  writeNextAchievementId(teacher, params.student, nextAchievementId + 1n);

  console.info(`${LOG} registerAchievementOnChain: confirmed`, {
    signature: signature || null,
  });

  return {
    achievementId: achievementIdBn,
    achievementPda,
    studentListPda,
    coursePda: coursePda ?? undefined,
    signature: signature || undefined,
  };
}

/** @deprecated Prefer importing from `./pdas` */
export { ACHIEVEMENT_SEED } from "./pdas";
