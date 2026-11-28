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
  /** True when a token achievement already has a reward receipt. */
  rewarded?: boolean;
  /** Whole-token amount minted (UI units) for a rewarded token achievement. */
  rewardAmount?: string | null;
  /** Bubblegum V2 cNFT asset id (client-side map). */
  nftAssetAddress?: string;
  /** Explorer URL for the cNFT asset id. */
  nftAssetExplorerUrl?: string;
}

export interface TeacherRewardMint {
  name: string;
  symbol: string;
  decimals: number;
  mint: string;
  /** Null for pre-Token-2022 (legacy) classroom mints that must be replaced. */
  mintId: bigint | null;
  isToken2022: boolean;
  configPda: string;
  explorerAddressUrl: string;
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
