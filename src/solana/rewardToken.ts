import { PublicKey } from "@solana/web3.js";

/** Token-2022 program. Must match the on-chain `token_program` constraint. */
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

/** Classic SPL Token — only used to detect orphan classroom mints from the previous release. */
export const LEGACY_SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

/** Associated Token Account program. */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

/** Must match `REWARD_DECIMALS` in the Anchor program. */
export const REWARD_DECIMALS = 6;

/** Must match `MAX_REWARD_NAME_BYTES`. */
export const MAX_REWARD_NAME_BYTES = 32;

/** Must match `MAX_REWARD_SYMBOL_BYTES`. */
export const MAX_REWARD_SYMBOL_BYTES = 10;

/** Max whole tokens a teacher can award in one reward (UI). */
export const MAX_REWARD_WHOLE_AMOUNT = 1_000_000_000n;

/** Must match on-chain `MAX_REWARD_AMOUNT` (base units). */
export const MAX_REWARD_AMOUNT =
  MAX_REWARD_WHOLE_AMOUNT * 10n ** BigInt(REWARD_DECIMALS);

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

const BASE_PER_WHOLE = 10n ** BigInt(REWARD_DECIMALS);

/**
 * Parse a whole-token UI amount into on-chain base units
 * (e.g. "10" → 10_000_000 with 6 decimals).
 */
export function parseRewardAmount(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return null;
  const whole = BigInt(trimmed);
  if (whole < 1n || whole > MAX_REWARD_WHOLE_AMOUNT) return null;
  return whole * BASE_PER_WHOLE;
}

/** Format on-chain base units as a whole-token string for the UI. */
export function formatRewardAmount(baseUnits: bigint | string): string {
  const raw = typeof baseUnits === "bigint" ? baseUnits : BigInt(baseUnits);
  return (raw / BASE_PER_WHOLE).toString();
}

/** Locale-aware whole-token amount for balance chips (e.g. "10.000"). */
export function formatWholeTokenDisplay(amount: string | number | bigint): string {
  const asNumber =
    typeof amount === "bigint"
      ? Number(amount)
      : typeof amount === "number"
        ? amount
        : Number(amount);
  if (!Number.isFinite(asNumber)) return String(amount);
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(asNumber);
}

/** Student ATA for the teacher's classroom mint on Token-2022. */
export function findStudentRewardAta(mint: PublicKey, student: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [student.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata;
}
