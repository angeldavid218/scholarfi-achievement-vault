import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import type { AchievementDefinition, AchievementKind } from "../types/achievement";
import { findAchievementPda } from "./pdas";

type AchievementAccountDecoded = {
  teacher: PublicKey;
  student: PublicKey;
  title: string;
  achievementType:
    | { token?: Record<string, never>; nft?: Record<string, never> }
    | "token"
    | "nft"
    | "Token"
    | "Nft";
  courseId?: BN | number | string | bigint | null;
};

function mapAchievementKind(value: AchievementAccountDecoded["achievementType"]): AchievementKind {
  if (typeof value === "string") {
    return value.toLowerCase() === "token" ? "token" : "nft";
  }
  return value.token ? "token" : "nft";
}

function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

function toOptionalBigInt(
  value: BN | number | string | bigint | null | undefined,
): bigint | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  return BigInt(value.toString());
}

function readNextAchievementIdFromStorage(teacher: PublicKey, student: PublicKey): bigint {
  if (typeof window === "undefined") return 0n;
  const key = `scholarfi_next_achievement_id_${teacher.toBase58()}_${student.toBase58()}`;
  const raw = window.localStorage.getItem(key);
  if (!raw) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

function inferAchievementIdFromPda(
  teacher: PublicKey,
  student: PublicKey,
  targetPda: PublicKey,
): string | undefined {
  const nextFromStorage = readNextAchievementIdFromStorage(teacher, student);
  const upperBound = nextFromStorage > 64n ? nextFromStorage + 4n : 64n;
  for (let i = 0n; i <= upperBound; i += 1n) {
    const derived = findAchievementPda(teacher, student, i);
    if (derived.equals(targetPda)) return i.toString();
  }
  return undefined;
}

/**
 * Reads all on-chain `Achievement` accounts for the provided teacher.
 * Returns one catalog row per PDA (better for edit/delete/course smoke tests).
 */
export async function fetchTeacherAchievements(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
  courseTitleById?: Map<string, string>,
): Promise<AchievementDefinition[]> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const accountNamespace = program.account as {
    achievement?: {
      all: (filters?: unknown[]) => Promise<Array<{ publicKey: PublicKey; account: unknown }>>;
    };
  };
  if (!accountNamespace.achievement) return [];

  // Achievement layout: discriminator(8) + student(32) + teacher(32) + ...
  const teacherFilterOffset = 8 + 32;
  const rows = await accountNamespace.achievement.all([
    { memcmp: { offset: teacherFilterOffset, bytes: wallet.publicKey.toBase58() } },
  ]);

  return rows
    .map((row) => {
      const account = row.account as AchievementAccountDecoded;
      const title = account.title?.trim() || "Achievement";
      const kind = mapAchievementKind(account.achievementType);
      const courseId = toOptionalBigInt(account.courseId);
      const courseIdStr = courseId !== null ? courseId.toString() : null;
      const studentKey = account.student.toBase58();
      const achievementId = inferAchievementIdFromPda(
        wallet.publicKey,
        account.student,
        row.publicKey,
      );

      return {
        id: row.publicKey.toBase58(),
        name: title,
        kind,
        description: `Estudiante ${studentKey.slice(0, 4)}…${studentKey.slice(-4)}`,
        studentsCount: 1,
        courseId: courseIdStr,
        courseTitle:
          courseIdStr && courseTitleById ? (courseTitleById.get(courseIdStr) ?? null) : null,
        sampleAchievementPda: row.publicKey.toBase58(),
        explorerAddressUrl: explorerAddressUrl(row.publicKey.toBase58()),
        deleteStudentPubkey: studentKey,
        deleteAchievementId: achievementId,
      } satisfies AchievementDefinition;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
