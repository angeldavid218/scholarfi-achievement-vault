import type { AchievementKind } from "../../types/achievement";

const LABELS: Record<AchievementKind, string> = {
  nft: "NFT",
  token: "TOKEN",
};

interface AchievementTypeBadgeProps {
  kind: AchievementKind;
}

export const AchievementTypeBadge = ({ kind }: AchievementTypeBadgeProps) => {
  const palette =
    kind === "nft"
      ? "badge-accent text-accent-content border-transparent"
      : "badge-secondary text-secondary-content border-transparent";

  return <div className={`badge badge-sm font-semibold capitalize ${palette} p-1`}>{LABELS[kind]}</div>;
};
