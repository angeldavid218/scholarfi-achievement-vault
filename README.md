# ScholarFi Achievement Vault

React + Vite frontend for **ScholarFi Lite** on Solana Devnet. Teachers manage a student roster, courses, Token-2022 classroom rewards, and **Bubblegum V2 compressed NFT (cNFT) achievements**.

- **Branch:** `cnft` — Bubblegum V2 cNFT minting
- **Contracts:** [scholarfi-lite-contracts](https://github.com/angeldavid218/scholarfi-lite-contracts) (program `7JTpTv6ftwRJwyXasGjU7L1swFnrizKh7nEeHnSbVMbs`)

## Features

| Area | Behavior |
|------|----------|
| Roster / courses | PDA CRUD against the Anchor program |
| Token achievements | Mint Token-2022 classroom points into the student ATA |
| NFT achievements | Same `register_achievement` tx also mints a **Bubblegum V2 cNFT** for the student |

## Bubblegum V2 cNFT

NFT achievements are **client-side Bubblegum V2** mints. The Anchor program is unchanged: it still only stores `AchievementType::Nft` on the Achievement PDA.

Setup (once per teacher):

1. Paste/validate a **public Merkle tree** address (session tree, or create one as mentor)
2. Create a Metaplex Core **collection with the `BubblegumV2` plugin** (do not reuse a plain Core collection from the `nft` branch)
3. Config `{ tree, collection, uri }` is saved in `localStorage`

When the teacher emits a logro with type **NFT**:

1. The app builds `register_achievement`
2. It appends Bubblegum `mintV2` (`leafOwner` = student, authority/payer = teacher)
3. Both instructions go in **one transaction** — **teacher-only** signer (no asset keypair)

Listing minted cNFTs needs a **DAS-capable RPC** (e.g. Helius Devnet). The public Solana RPC cannot run `getAsset` / `getAssetsByGroup`.

Off-chain metadata lives in [`docs/nft-metadata/`](docs/nft-metadata/):

- [`metadata.json`](docs/nft-metadata/metadata.json)
- [`nft-img.png`](docs/nft-metadata/nft-img.png)

Public URI (branch `cnft`):

```text
https://raw.githubusercontent.com/angeldavid218/scholarfi-achievement-vault/cnft/docs/nft-metadata/metadata.json
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Required env:

```env
VITE_PROGRAM_ID=7JTpTv6ftwRJwyXasGjU7L1swFnrizKh7nEeHnSbVMbs
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

Connect a wallet with Devnet SOL (teacher).

## Happy path (cNFT)

1. Start the app (`npm run dev`) and connect the **teacher** wallet on Devnet.
2. **Lista de estudiantes** — create the list if needed and add at least one student wallet.
3. **Colección comprimida**:
   - Paste the session public Merkle tree → **Validar árbol**
   - Name: e.g. `Logros del aula`
   - Metadata URI: the `metadata.json` raw URL above
   - **Crear colección BubblegumV2** and approve in the wallet
4. **Crear logro**:
   - Tipo: **NFT**
   - Nombre: e.g. `Excelencia cNFT`
   - Optional course
   - Assign the student → **Crear y emitir**
5. Confirm in the catalog:
   - Achievement **PDA** Explorer link
   - **cNFT** asset id (when parsed from the mint tx / localStorage map)
6. Optionally confirm with DAS `getAsset` against your Helius Devnet endpoint.

Token path (unchanged): create the classroom Token-2022 mint, emit a **Token** achievement with an amount.

## Stack

- React 19 + Vite + TypeScript + Tailwind / daisyUI
- `@coral-xyz/anchor` + `@solana/web3.js` + wallet-adapter
- `@metaplex-foundation/mpl-bubblegum` + `mpl-core` + DAS API + Umi (instruction builders only; wallet sends the tx)
