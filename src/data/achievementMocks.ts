import { Keypair } from "@solana/web3.js";
import type { StudentSummary } from "../types/achievement";

const mockStudentKeypairs = Array.from({ length: 5 }, () => Keypair.generate());

export const MOCK_STUDENTS: StudentSummary[] = [
  { id: "stu-2041", displayName: "Valentina Ríos", publicKey: mockStudentKeypairs[0]!.publicKey },
  { id: "stu-1188", displayName: "Mateo Calderón", publicKey: mockStudentKeypairs[1]!.publicKey },
  { id: "stu-3302", displayName: "Camila Duarte", publicKey: mockStudentKeypairs[2]!.publicKey },
  { id: "stu-0094", displayName: "Lucas Paredes", publicKey: mockStudentKeypairs[3]!.publicKey },
  { id: "stu-4410", displayName: "Isabella Núñez", publicKey: mockStudentKeypairs[4]!.publicKey },
];

