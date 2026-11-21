import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import type { CourseSummary } from "../types/achievement";

type CourseAccountDecoded = {
  teacher: PublicKey;
  courseId: BN | number | string | bigint;
  title: string;
  active: boolean;
};

function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

function toBigInt(value: BN | number | string | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  return BigInt(value.toString());
}

/**
 * Reads all on-chain `Course` accounts for the connected teacher.
 */
export async function fetchTeacherCourses(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<CourseSummary[]> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const accountNamespace = program.account as {
    course?: {
      all: (filters?: unknown[]) => Promise<Array<{ publicKey: PublicKey; account: unknown }>>;
    };
  };
  if (!accountNamespace.course) return [];

  // Course layout: discriminator(8) + teacher(32) + ...
  const teacherFilterOffset = 8;
  const rows = await accountNamespace.course.all([
    { memcmp: { offset: teacherFilterOffset, bytes: wallet.publicKey.toBase58() } },
  ]);

  return rows
    .map((row) => {
      const account = row.account as CourseAccountDecoded;
      const courseId = toBigInt(account.courseId);
      return {
        id: courseId.toString(),
        courseId,
        title: account.title?.trim() || `Curso #${courseId}`,
        active: Boolean(account.active),
        pda: row.publicKey.toBase58(),
        explorerAddressUrl: explorerAddressUrl(row.publicKey.toBase58()),
      } satisfies CourseSummary;
    })
    .sort((a, b) => Number(a.courseId - b.courseId));
}
