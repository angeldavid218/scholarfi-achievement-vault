import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findStudentListPda } from "./pdas";

export type FetchTeacherStudentListResult = {
  studentListPda: PublicKey;
  students: PublicKey[];
  exists: boolean;
};

function parseStudentsFromStudentListAccount(account: unknown): PublicKey[] {
  if (!account || typeof account !== "object") return [];
  const maybeStudents = (account as { students?: unknown }).students;
  if (!Array.isArray(maybeStudents)) return [];

  const parsed: PublicKey[] = [];
  for (const entry of maybeStudents) {
    try {
      parsed.push(new PublicKey(entry as PublicKey | string | Uint8Array));
    } catch {
      return [];
    }
  }
  return parsed;
}

/**
 * Reads the teacher's `StudentList` PDA if it exists. Does not create accounts.
 */
export async function fetchTeacherStudentList(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<FetchTeacherStudentListResult> {
  const teacher = wallet.publicKey;
  const studentListPda = findStudentListPda(teacher);
  const info = await connection.getAccountInfo(studentListPda);
  if (!info) {
    return { studentListPda, students: [], exists: false };
  }

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);
  const accountNamespace = program.account as {
    studentList?: { fetch: (address: PublicKey) => Promise<unknown> };
  };
  if (!accountNamespace.studentList) {
    return { studentListPda, students: [], exists: true };
  }

  const account = await accountNamespace.studentList.fetch(studentListPda);
  return {
    studentListPda,
    students: parseStudentsFromStudentListAccount(account),
    exists: true,
  };
}
