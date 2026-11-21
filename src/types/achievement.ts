import type { PublicKey } from "@solana/web3.js";

export type AchievementKind = "nft" | "token";

export interface AchievementDefinition {
  id: string;
  name: string;
  kind: AchievementKind;
  description: string;
  studentsCount: number;
  courseId?: string | null;
  courseTitle?: string | null;
  explorerAddressUrl?: string;
  sampleAchievementPda?: string;
  deleteStudentPubkey?: string;
  deleteAchievementId?: string;
}

export interface StudentSummary {
  id: string;
  displayName: string;
  publicKey: PublicKey;
}

export interface CourseSummary {
  id: string;
  courseId: bigint;
  title: string;
  active: boolean;
  pda: string;
  explorerAddressUrl?: string;
}

export interface RecentIssuance {
  id: string;
  title: string;
  relativeTime: string;
}
