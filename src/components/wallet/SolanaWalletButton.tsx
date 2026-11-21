import { useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const shorten = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

export const SolanaWalletButton = () => {
  const { publicKey, disconnect, connecting, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [copied, setCopied] = useState(false);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        className="btn btn-primary shrink-0"
        disabled={connecting}
        onClick={() => setVisible(true)}
      >
        {connecting ? "Conectando…" : "Conectar billetera"}
      </button>
    );
  }

  const address = publicKey.toBase58();

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="btn btn-outline border-base-300 text-base-content list-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {wallet?.adapter.icon ? (
            <img src={wallet.adapter.icon} alt="" className="size-5 rounded-sm" width={20} height={20} />
          ) : null}
          <span className="font-mono text-sm font-semibold">{shorten(address)}</span>
        </span>
      </summary>
      <ul className="menu border-base-300 bg-base-100 dropdown-content rounded-box z-50 mt-2 w-56 border p-2 shadow-lg">
        <li>
          <button
            type="button"
            className="text-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copiado" : "Copiar dirección"}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-sm"
            onClick={() => {
              closeMenu();
              setVisible(true);
            }}
          >
            Cambiar billetera
          </button>
        </li>
        <li>
          <button
            type="button"
            className="text-sm"
            onClick={() => {
              closeMenu();
              void disconnect();
            }}
          >
            Desconectar
          </button>
        </li>
      </ul>
    </details>
  );
};
