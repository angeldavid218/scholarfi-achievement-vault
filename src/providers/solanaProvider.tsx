import { type FC, type ReactNode, useEffect, useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import "@solana/wallet-adapter-react-ui/styles.css";

import { SCHOLARFI_LITE_CLUSTER_URL, SCHOLARFI_LITE_PROGRAM_ID } from "../connection";

const LOG = "[ScholarFi Achievement Vault]";

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  const endpoint = useMemo(() => SCHOLARFI_LITE_CLUSTER_URL, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
    ],
    [],
  );

  useEffect(() => {
    console.info(`${LOG} SolanaProvider: boot`, {
      endpoint,
      programId: SCHOLARFI_LITE_PROGRAM_ID.toBase58(),
      network: "devnet",
      walletAdapters: ["PhantomWalletAdapter", "SolflareWalletAdapter"],
      autoConnect: true,
    });
  }, [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
