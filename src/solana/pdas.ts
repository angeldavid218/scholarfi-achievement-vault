import { PublicKey } from "@solana/web3.js";

import { SCHOLARFI_LITE_PROGRAM_ID } from "../connection";

/** UTF-8 bytes of `"student_list"` — must match `STUDENT_LIST_SEED` in the Anchor program. */
export const STUDENT_LIST_SEED = new TextEncoder().encode("student_list");

/** UTF-8 bytes of `"achievement"` — must match `ACHIEVEMENT_SEED` in the Anchor program. */
export const ACHIEVEMENT_SEED = new TextEncoder().encode("achievement");

/** UTF-8 bytes of `"course"` — must match `COURSE_SEED` in the Anchor program. */
export const COURSE_SEED = new TextEncoder().encode("course");

/** UTF-8 bytes of `"reward_mint"` — must match `REWARD_MINT_SEED` in the Anchor program. */
export const REWARD_MINT_SEED = new TextEncoder().encode("reward_mint");

/** UTF-8 bytes of `"reward_config"` — must match `REWARD_CONFIG_SEED` in the Anchor program. */
export const REWARD_CONFIG_SEED = new TextEncoder().encode("reward_config");

/** UTF-8 bytes of `"reward"` — must match `REWARD_RECEIPT_SEED` in the Anchor program. */
export const REWARD_RECEIPT_SEED = new TextEncoder().encode("reward");

export function u64ToLeBytes(value: bigint | number | string): Uint8Array {
  const bn = typeof value === "bigint" ? value : BigInt(value);
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(0, bn, true);
  return bytes;
}

export function findStudentListPda(
  teacher: PublicKey,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [STUDENT_LIST_SEED, teacher.toBuffer()],
    programId,
  );
  return pda;
}

export function findCoursePda(
  teacher: PublicKey,
  courseId: bigint | number | string,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [COURSE_SEED, teacher.toBuffer(), u64ToLeBytes(courseId)],
    programId,
  );
  return pda;
}

/** Versioned classroom mint PDA: `["reward_mint", teacher, mint_id]`. */
export function findRewardMintPda(
  teacher: PublicKey,
  mintId: bigint | number | string,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [REWARD_MINT_SEED, teacher.toBuffer(), u64ToLeBytes(mintId)],
    programId,
  );
  return pda;
}

/**
 * Pre-Token-2022 mint PDA without `mint_id`.
 * Still used to recognize orphan classic mints after close/replace.
 */
export function findLegacyRewardMintPda(
  teacher: PublicKey,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [REWARD_MINT_SEED, teacher.toBuffer()],
    programId,
  );
  return pda;
}

/** Resolve which mint_id derives to `mint`, or null for a legacy (unversioned) mint. */
export function resolveRewardMintId(
  teacher: PublicKey,
  mint: PublicKey,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
  upperBound = 64n,
): bigint | null {
  if (findLegacyRewardMintPda(teacher, programId).equals(mint)) return null;
  for (let i = 0n; i <= upperBound; i += 1n) {
    if (findRewardMintPda(teacher, i, programId).equals(mint)) return i;
  }
  return null;
}

export function findRewardConfigPda(
  teacher: PublicKey,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [REWARD_CONFIG_SEED, teacher.toBuffer()],
    programId,
  );
  return pda;
}

export function findRewardReceiptPda(
  achievement: PublicKey,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [REWARD_RECEIPT_SEED, achievement.toBuffer()],
    programId,
  );
  return pda;
}

export function findAchievementPda(
  teacher: PublicKey,
  student: PublicKey,
  achievementId: bigint | number | string,
  programId: PublicKey = SCHOLARFI_LITE_PROGRAM_ID,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [ACHIEVEMENT_SEED, teacher.toBuffer(), student.toBuffer(), u64ToLeBytes(achievementId)],
    programId,
  );
  return pda;
}
