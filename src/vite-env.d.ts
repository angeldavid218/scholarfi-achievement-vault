/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional devnet RPC (e.g. Helius). Falls back to public devnet if unset. */
  readonly VITE_SOLANA_RPC_URL?: string;
  /** Deployed program id on devnet. If unset, falls back to `address` in the bundled IDL JSON. */
  readonly VITE_PROGRAM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
