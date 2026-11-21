import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  type Connection,
} from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
  SCHOLARFI_LITE_PROGRAM_ID,
} from "../connection";

import { STUDENT_LIST_SEED, findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export { STUDENT_LIST_SEED };

/** Default number of demo student pubkeys to register per teacher via `create_student_list`. */
const DEFAULT_STUDENT_COUNT = 2;

export type CreateStudentListIfNeededOptions = {
  /** How many demo student wallets to generate the first time (only pubkeys are stored). */
  studentCount?: number;
  /** Override default `scholarfi_students_${teacher}` localStorage key prefix. */
  storageKeyPrefix?: string;
};

export type CreateStudentListIfNeededResult = {
  studentListPda: PublicKey;
  students: PublicKey[];
  /** Present when this call submitted `create_student_list`; omitted if the PDA already existed. */
  signature?: string;
};

function studentsStorageKey(teacher: PublicKey, prefix: string): string {
  return `${prefix}${teacher.toBase58()}`;
}

function readStudentsFromStorage(key: string): PublicKey[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((entry) => new PublicKey(String(entry)));
  } catch {
    return null;
  }
}

function writeStudentsToStorage(key: string, students: PublicKey[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    key,
    JSON.stringify(students.map((p) => p.toBase58())),
  );
}

function parseStudentsFromStudentListAccount(account: unknown): PublicKey[] | null {
  if (!account || typeof account !== "object") return null;
  const maybeStudents = (account as { students?: unknown }).students;
  if (!Array.isArray(maybeStudents)) return null;

  const parsed: PublicKey[] = [];
  for (const entry of maybeStudents) {
    try {
      parsed.push(new PublicKey(entry as PublicKey | string | Uint8Array));
    } catch {
      return null;
    }
  }
  return parsed;
}

/**
 * Ensures the teacher has a persisted set of demo student pubkeys (localStorage)
 * and that the on-chain `StudentList` PDA exists for `create_student_list`.
 * The teacher on-chain is always `wallet.publicKey` (the connected signer).
 *
 * Only **public keys** are stored locally. Generated `Keypair`s are discarded after
 * use; those demo students cannot sign transactions unless you change this to
 * persist secret keys (not recommended).
 */
export async function createStudentListIfNeeded(
  wallet: AnchorWallet,
  connection: Connection = createScholarFiLiteConnection(),
  options?: CreateStudentListIfNeededOptions,
): Promise<CreateStudentListIfNeededResult> {
  const teacher = wallet.publicKey;
  const storagePrefix = options?.storageKeyPrefix ?? "scholarfi_students_";
  const storageKey = studentsStorageKey(teacher, storagePrefix);
  const studentListPda = findStudentListPda(teacher);

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);
  const readStudentsFromChainOrNull = async (): Promise<PublicKey[] | null> => {
    try {
      const accountNamespace = program.account as {
        studentList?: { fetchNullable: (address: PublicKey) => Promise<unknown> };
      };
      if (!accountNamespace.studentList) return null;
      const account = await accountNamespace.studentList.fetchNullable(studentListPda);
      return parseStudentsFromStudentListAccount(account);
    } catch {
      return null;
    }
  };

  console.info(`${LOG} createStudentListIfNeeded: start`, {
    rpc: connection.rpcEndpoint,
    teacher: teacher.toBase58(),
    programId: SCHOLARFI_LITE_PROGRAM_ID.toBase58(),
    storageKey,
  });

  let students = readStudentsFromStorage(storageKey);
  if (!students) {
    const count = options?.studentCount ?? DEFAULT_STUDENT_COUNT;
    students = Array.from(
      { length: count },
      () => Keypair.generate().publicKey,
    );
    writeStudentsToStorage(storageKey, students);
    console.info(
      `${LOG} createStudentListIfNeeded: generated new student pubkeys`,
      {
        count: students.length,
        pubkeys: students.map((p) => p.toBase58()),
      },
    );
  } else {
    console.info(
      `${LOG} createStudentListIfNeeded: loaded student pubkeys from localStorage`,
      {
        count: students.length,
        pubkeys: students.map((p) => p.toBase58()),
      },
    );
  }

  console.info(`${LOG} createStudentListIfNeeded: student list PDA`, {
    studentListPda: studentListPda.toBase58(),
  });

  const existing = await connection.getAccountInfo(studentListPda);
  if (existing) {
    const chainStudents = await readStudentsFromChainOrNull();
    if (chainStudents && chainStudents.length > 0) {
      writeStudentsToStorage(storageKey, chainStudents);
      console.info(
        `${LOG} createStudentListIfNeeded: loaded students from existing on-chain list`,
        {
          count: chainStudents.length,
          pubkeys: chainStudents.map((p) => p.toBase58()),
        },
      );
      return { studentListPda, students: chainStudents };
    }

    console.info(
      `${LOG} createStudentListIfNeeded: PDA already exists — skipping create_student_list tx`,
      {
        dataLen: existing.data.length,
      },
    );
    return { studentListPda, students };
  }

  console.info(
    `${LOG} createStudentListIfNeeded: sending create_student_list …`,
  );

  const signature = await program.methods
    .createStudentList(students)
    .accounts({
      teacher,
      studentList: studentListPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
    .catch(async (e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      const isAlreadyProcessed = message.includes("already been processed");

      if (isAlreadyProcessed) {
        // Idempotency guard: if a duplicate send happens but the account now exists,
        // treat this as success instead of surfacing a false-negative UI error.
        const accountNowExists =
          await connection.getAccountInfo(studentListPda);
        if (accountNowExists) {
          console.warn(
            `${LOG} createStudentListIfNeeded: duplicate tx detected, but student list exists — treating as success`,
            { studentListPda: studentListPda.toBase58() },
          );
          return "";
        }
      }

      throw e;
    });

  console.info(
    `${LOG} createStudentListIfNeeded: create_student_list confirmed`,
    {
      signature: signature || null,
    },
  );

  const chainStudents = await readStudentsFromChainOrNull();
  if (chainStudents && chainStudents.length > 0) {
    writeStudentsToStorage(storageKey, chainStudents);
    return { studentListPda, students: chainStudents, signature: signature || undefined };
  }

  return { studentListPda, students, signature: signature || undefined };
}
