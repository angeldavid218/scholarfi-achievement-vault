/**
 * Devnet smoke: create Core collection, student list, then register_achievement + Core Asset.
 * Usage: node scripts/smoke-nft-core.mjs
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
} from "@metaplex-foundation/umi";
import { create, createCollection, mplCore } from "@metaplex-foundation/mpl-core";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RPC = process.env.VITE_SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.VITE_PROGRAM_ID?.trim() || "7JTpTv6ftwRJwyXasGjU7L1swFnrizKh7nEeHnSbVMbs",
);
const METADATA_URI =
  "https://raw.githubusercontent.com/metaplex-foundation/mpl-core/main/clients/js/test/fixtures/metadata.json";

const idl = JSON.parse(
  readFileSync(join(ROOT, "src/idl/scholarfi_lite_contracts.json"), "utf8"),
);
idl.address = PROGRAM_ID.toBase58();

const secret = JSON.parse(readFileSync(join(homedir(), ".config/solana/id.json"), "utf8"));
const teacher = Keypair.fromSecretKey(Uint8Array.from(secret));
const student = Keypair.generate();
const connection = new Connection(RPC, "confirmed");
const wallet = new Wallet(teacher);
const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
const program = new Program(idl, provider);
const umi = createUmi(RPC).use(mplCore());

function seed(s) {
  return new TextEncoder().encode(s);
}
function u64Le(n) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
}
function pda(seeds) {
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
}

function aWeb3(builder, cuentaNueva) {
  return {
    ixs: builder.getInstructions().map(toWeb3JsInstruction),
    firmante: Keypair.fromSecretKey(cuentaNueva.secretKey),
    direccion: cuentaNueva.publicKey.toString(),
  };
}

async function send(ixs, signers = []) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: teacher.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(...ixs);
  const sig = await provider.sendAndConfirm(tx, signers, { commitment: "confirmed" });
  return sig;
}

console.log("Teacher:", teacher.publicKey.toBase58());
console.log("Student:", student.publicKey.toBase58());
console.log("RPC:", RPC);

// 1) Collection
const autoridad = createNoopSigner(publicKey(teacher.publicKey.toBase58()));
const coleccion = generateSigner(umi);
const col = aWeb3(
  createCollection(umi, {
    collection: coleccion,
    name: "ScholarFi Smoke Logros",
    uri: METADATA_URI,
    payer: autoridad,
    updateAuthority: autoridad.publicKey,
  }),
  coleccion,
);
const colSig = await send(col.ixs, [col.firmante]);
console.log("Collection:", col.direccion);
console.log("Collection TX:", colSig);

// 2) Student list
const studentList = pda([seed("student_list"), teacher.publicKey.toBuffer()]);
const listInfo = await connection.getAccountInfo(studentList);
if (!listInfo) {
  const sig = await program.methods
    .createStudentList([student.publicKey])
    .accounts({
      teacher: teacher.publicKey,
      studentList,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("Student list created:", studentList.toBase58(), sig);
} else {
  try {
    await program.methods
      .addStudent(student.publicKey)
      .accounts({
        teacher: teacher.publicKey,
        studentList,
      })
      .rpc();
    console.log("Student added to existing list");
  } catch (e) {
    console.log("Student list exists; add skipped:", e.message?.slice(0, 120));
  }
}

// 3) register_achievement + Core create
let achievementId = 0n;
let achievementPda = pda([
  seed("achievement"),
  teacher.publicKey.toBuffer(),
  student.publicKey.toBuffer(),
  u64Le(achievementId),
]);
while (await connection.getAccountInfo(achievementPda)) {
  achievementId += 1n;
  achievementPda = pda([
    seed("achievement"),
    teacher.publicKey.toBuffer(),
    student.publicKey.toBuffer(),
    u64Le(achievementId),
  ]);
}

const registerIx = await program.methods
  .registerAchievement(
    new BN(achievementId.toString()),
    "Smoke NFT logro",
    { nft: {} },
    null,
  )
  .accounts({
    teacher: teacher.publicKey,
    student: student.publicKey,
    studentList,
    course: null,
    achievement: achievementPda,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

const assetSigner = generateSigner(umi);
const asset = aWeb3(
  create(umi, {
    asset: assetSigner,
    collection: {
      publicKey: publicKey(col.direccion),
      oracles: [],
      lifecycleHooks: [],
    },
    owner: publicKey(student.publicKey.toBase58()),
    authority: autoridad,
    payer: autoridad,
    name: "Smoke NFT logro",
    uri: METADATA_URI,
    plugins: [
      {
        type: "Attributes",
        attributeList: [
          { key: "achievement_id", value: achievementId.toString() },
          { key: "student", value: student.publicKey.toBase58() },
          { key: "teacher", value: teacher.publicKey.toBase58() },
        ],
      },
      {
        type: "PermanentFreezeDelegate",
        frozen: true,
        authority: { type: "UpdateAuthority" },
      },
    ],
  }),
  assetSigner,
);

const mintSig = await send([registerIx, ...asset.ixs], [asset.firmante]);
console.log("Achievement PDA:", achievementPda.toBase58());
console.log("Core Asset:", asset.direccion);
console.log("Combined TX:", mintSig);
console.log("Explorer TX:", `https://explorer.solana.com/tx/${mintSig}?cluster=devnet`);
console.log("Explorer Asset:", `https://explorer.solana.com/address/${asset.direccion}?cluster=devnet`);
console.log("SMOKE OK");
