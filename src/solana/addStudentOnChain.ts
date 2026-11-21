import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";

import {
  createScholarFiLiteConnection,
  scholarFiLiteIdl,
} from "../connection";
import { findStudentListPda } from "./pdas";

const LOG = "[ScholarFi Achievement Vault]";

export type AddStudentOnChainResult = {
  studentListPda: PublicKey;
  student: PublicKey;
  signature?: string;
};

/**
 * Appends one student pubkey to the teacher's on-chain `StudentList` via `add_student`.
 */
export async function addStudentOnChain(
  wallet: AnchorWallet,
  student: PublicKey,
  connection: Connection = createScholarFiLiteConnection(),
): Promise<AddStudentOnChainResult> {
  const teacher = wallet.publicKey;
  const studentListPda = findStudentListPda(teacher);

  console.info(`${LOG} addStudentOnChain: start`, {
    teacher: teacher.toBase58(),
    student: student.toBase58(),
    studentListPda: studentListPda.toBase58(),
  });

  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment ?? "confirmed",
  });
  const program = new Program(scholarFiLiteIdl as Idl, provider);

  const signature = await program.methods
    .addStudent(student)
    .accounts({
      teacher,
      studentList: studentListPda,
    })
    .rpc();

  console.info(`${LOG} addStudentOnChain: confirmed`, { signature });

  return { studentListPda, student, signature };
}
