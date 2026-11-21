import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import scholarFiLiteContractsIdl from "./idl/scholarfi_lite_contracts.json";

/**
 * Solana RPC for the app (devnet).
 * Set `VITE_SOLANA_RPC_URL` in `.env` to your Helius devnet URL, e.g.
 * `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`
 * If unset, uses the public Solana devnet endpoint.
 */
function resolveScholarFiRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
  if (fromEnv) return fromEnv;
  return clusterApiUrl("devnet");
}

export const SCHOLARFI_LITE_CLUSTER_URL = resolveScholarFiRpcUrl();

/**
 * Program id for transactions and PDA derivation.
 * Set `VITE_PROGRAM_ID` in `.env` after devnet deploy; otherwise falls back to `address` in the IDL JSON.
 */
function resolveScholarFiProgramId(): PublicKey {
  const fromEnv = import.meta.env.VITE_PROGRAM_ID?.trim();
  if (fromEnv) return new PublicKey(fromEnv);
  return new PublicKey(scholarFiLiteContractsIdl.address);
}

export const SCHOLARFI_LITE_PROGRAM_ID = resolveScholarFiProgramId();

/**
 * Anchor IDL with `address` forced to match `SCHOLARFI_LITE_PROGRAM_ID`.
 * Anchor's `Program` constructor reads `idl.address`; it must stay in sync when using `VITE_PROGRAM_ID`.
 */
export const scholarFiLiteIdl = {
  ...scholarFiLiteContractsIdl,
  address: SCHOLARFI_LITE_PROGRAM_ID.toBase58(),
};

export function createScholarFiLiteConnection(
  commitment: Connection["commitment"] = "confirmed",
): Connection {
  return new Connection(SCHOLARFI_LITE_CLUSTER_URL, commitment);
}

export type ProgramConnectionResult =
  | { ok: true; rpcUrl: string; programId: string; slot: number; executable: true }
  | { ok: false; rpcUrl: string; programId: string; reason: string };

/**
 * Checks that the RPC is reachable and the ScholarFi Achievement Vault program account exists and is executable.
 * Call from a `useEffect`, a test button, or the browser console after importing this module.
 */
export async function testScholarFiProgramConnection(
  connection: Connection = createScholarFiLiteConnection(),
): Promise<ProgramConnectionResult> {
  const rpcUrl = connection.rpcEndpoint;
  const programId = SCHOLARFI_LITE_PROGRAM_ID.toBase58();

  try {
    const slot = await connection.getSlot("processed");
    const info = await connection.getAccountInfo(SCHOLARFI_LITE_PROGRAM_ID);

    if (!info) {
      return {
        ok: false,
        rpcUrl,
        programId,
        reason:
          "No account at this program id. Deploy the program to this cluster or confirm VITE_PROGRAM_ID / RPC URL.",
      };
    }

    if (!info.executable) {
      return {
        ok: false,
        rpcUrl,
        programId,
        reason: "Account exists but is not executable — not a deployed program.",
      };
    }

    return { ok: true, rpcUrl, programId, slot, executable: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      rpcUrl,
      programId,
      reason: `RPC error: ${message}`,
    };
  }
}
