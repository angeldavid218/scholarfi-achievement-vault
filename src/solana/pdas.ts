import { PublicKey } from "@solana/web3.js";

import { SCHOLARFI_LITE_PROGRAM_ID } from "../connection";

/** UTF-8 bytes of `"student_list"` — must match `STUDENT_LIST_SEED` in the Anchor program. */
export const STUDENT_LIST_SEED = new TextEncoder().encode("student_list");

/** UTF-8 bytes of `"achievement"` — must match `ACHIEVEMENT_SEED` in the Anchor program. */
export const ACHIEVEMENT_SEED = new TextEncoder().encode("achievement");

/** UTF-8 bytes of `"course"` — must match `COURSE_SEED` in the Anchor program. */
export const COURSE_SEED = new TextEncoder().encode("course");

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
