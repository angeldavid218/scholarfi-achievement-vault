import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type RemoveStudentOnChainResult = {
  studentListPda: PublicKey;
  student: PublicKey;
  signature?: string;
};

/**
 * Removes one student pubkey from the teacher's on-chain `StudentList` via `remove_student`.
 */
export async function removeStudentOnChain(
  wallet: AnchorWallet,
  student: PublicKey,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<RemoveStudentOnChainResult> {
  const teacher = wallet.publicKey;
  const studentListPda = findStudentListPda(teacher);

  console.info(`${LOG} removeStudentOnChain: start`, {
    teacher: teacher.toBase58(),
    student: student.toBase58(),
    studentListPda: studentListPda.toBase58(),
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .removeStudent(student)
    .accounts({
      teacher,
      studentList: studentListPda,
    })
    .rpc();

  console.info(`${LOG} removeStudentOnChain: confirmed`, { signature });

  return { studentListPda, student, signature };
}
