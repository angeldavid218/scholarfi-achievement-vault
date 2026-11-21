import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const IconPlusCircle = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
  </svg>
);

export const IconSparkles = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11 3a1 1 0 0 1 2 0l.4 2.35a1 1 0 0 0 .82.82L16.57 7a1 1 0 0 1 0 2l-2.35.4a1 1 0 0 0-.82.82L13 12.57a1 1 0 0 1-2 0l-.4-2.35a1 1 0 0 0-.82-.82L7.43 9a1 1 0 0 1 0-2l2.35-.4a1 1 0 0 0 .82-.82L11 3Z" />
    <path d="M18.5 13a.5.5 0 0 1 .5.5l.18 1.05a.5.5 0 0 0 .41.41l1.05.18a.5.5 0 0 1 0 .98l-1.05.18a.5.5 0 0 0-.41.41l-.18 1.05a.5.5 0 0 1-.98 0l-.18-1.05a.5.5 0 0 0-.41-.41l-1.05-.18a.5.5 0 0 1 0-.98l1.05-.18a.5.5 0 0 0 .41-.41l.18-1.05a.5.5 0 0 1 .5-.5Z" />
  </svg>
);

export const IconShield = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path
      d="M12 3 5 6v6c0 5 3.5 8.5 7 9.5 3.5-1 7-4.5 7-9.5V6l-7-3Z"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconSearch = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-3.2-3.2" strokeLinecap="round" />
  </svg>
);

export const IconUser = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
  </svg>
);

export const IconCloud = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path
      d="M7 18h10a4 4 0 0 0 .6-7.96A5 5 0 0 0 7 11a3 3 0 0 0 0 6Z"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconUsers = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
  </svg>
);

export const IconCoin = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9.5 9.5c1-1 4-1 4 1.2 0 2-2 2.2-2 2.2S9 14 9 15.2C9 17.5 14 17.5 14 15" strokeLinecap="round" />
  </svg>
);

export const IconEye = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconPencil = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 20h9" strokeLinecap="round" />
    <path d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z" strokeLinejoin="round" />
  </svg>
);

export const IconTrash = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M4 7h16" strokeLinecap="round" />
    <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    <path d="M6 7l1 14h10l1-14" strokeLinejoin="round" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
  </svg>
);

/** Token / traditional achievement thumbnail */
export const IconTrophy = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M8 21h8" strokeLinecap="round" />
    <path d="M12 17v4" strokeLinecap="round" />
    <path
      d="M7 4h10v2a5 5 0 0 1-10 0V4Z"
      strokeLinejoin="round"
    />
    <path d="M7 6H5a2 2 0 0 0 2 2M17 6h2a2 2 0 0 1-2 2" strokeLinecap="round" />
  </svg>
);

/** NFT-style collectible thumbnail */
export const IconNftHex = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7L12 2.5Z" strokeLinejoin="round" />
    <path d="M12 8 15.5 12 12 16 8.5 12 12 8Z" strokeLinejoin="round" />
  </svg>
);
