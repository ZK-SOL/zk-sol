import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Zklsol } from "../target/types/zklsol";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import assert from "assert";
import {
  airdrop,
  modifyComputeUnits,
  processTransaction,
} from "../solita/sol-helpers";
import {
  buildCreateMerkleTransactionInstruction,
  buildDepositTransactionInstruction,
  buildDumpProofTransactionInstructionsArray,
  buildWithdrawTransactionInstruction,
  GenerateProofPath,
} from "../solita/wrappers/merkle_wrapper";
import { CryptoHelper, Rand } from "../solita/crypto-helpers";
import {
  getMerkleAccount,
  getMerkleNodeAccount,
  isgNullifierHashUsed,
} from "../solita/pda/merkle_pda";
import { run_circuit, ZkHelper } from "../solita/zk-helper";
import { NATIVE_MINT } from "@solana/spl-token";

const signer = Keypair.generate();
const anonSigner = Keypair.generate();
const depth = 20;
const deposits = 5;
const CIRCUIT_NAME = `withdraw${depth}`;
const secrets: Rand[] = [];
const nullifers: Rand[] = [];
for (let i = 0; i < deposits; i++) {
  secrets[i] = CryptoHelper.generateAndPrepareRand(123 + i);
  nullifers[i] = CryptoHelper.generateAndPrepareRand(456 + i);
}

describe("ZKL-$SOL - merkle test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Zklsol as Program<Zklsol>;

  it("airdrop", async () => {
    for (const key of [signer, anonSigner]) {
      await airdrop(program, key.publicKey, LAMPORTS_PER_SOL * 50_000);
    }
  });

  it("create merkle", async () => {
    const instruction = await buildCreateMerkleTransactionInstruction({
      mint: NATIVE_MINT,
      signer: signer.publicKey,
      depth,
      depositSize: LAMPORTS_PER_SOL,
    });
    const sig = await processTransaction(
      [modifyComputeUnits, instruction],
      program.provider.connection,
      signer
    );
    const txn = await program.provider.connection.getParsedTransaction(
      sig.Signature,
      "confirmed"
    );
    assert.equal(
      sig.SignatureResult.err,
      null,
      `${txn?.meta?.logMessages.join("\n")}`
    );
  });

  it("add to merkle", async () => {
    for (let j = 0; j < deposits; j++) {
      const nullifierHash = CryptoHelper.hash(
        CryptoHelper.numberArrayToU8IntArray(nullifers[j].u8Array)
      );
      const isUsed = await isgNullifierHashUsed(
        program.provider.connection,
        nullifierHash
      );
      if (isUsed) {
        continue;
      }
      const nullifierNode = CryptoHelper.modInput(nullifers[j].u8Array);
      const secretNode = CryptoHelper.modInput(secrets[j].u8Array);
      const commitmentBytes = CryptoHelper.from_children(
        nullifierNode,
        secretNode
      );
      const depositInstructions = await buildDepositTransactionInstruction({
        signer: signer.publicKey,
        input: commitmentBytes,
        depth,
        connection: program.provider.connection,
        mint: NATIVE_MINT,
      });

      const sig = await processTransaction(
        [modifyComputeUnits, ...depositInstructions],
        program.provider.connection,
        signer
      );
      const txn = await program.provider.connection.getParsedTransaction(
        sig.Signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        }
      );
      assert.equal(
        sig.SignatureResult.err,
        null,
        `${txn?.meta?.logMessages.join("\n")}`
      );
      const instructions = await buildDumpProofTransactionInstructionsArray({
        signer: signer.publicKey,
        connection: program.provider.connection,
        depth,
        mint: NATIVE_MINT,
      });
      for (const instruction of instructions) {
        const sig = await processTransaction(
          [modifyComputeUnits, instruction],
          program.provider.connection,
          signer
        );
        const txn = await program.provider.connection.getParsedTransaction(
          sig.Signature,
          {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          }
        );
        assert.equal(
          sig.SignatureResult.err,
          null,
          `${txn?.meta?.logMessages.join("\n")}`
        );
      }
    }
  });

  it("Withdraw", async () => {
    for (let j = 0; j < deposits; j++) {
      const proof_path: GenerateProofPath = CryptoHelper.generate_proof_path(
        depth,
        j
      );
      const merkle = await getMerkleAccount(
        program.provider.connection,
        depth,
        NATIVE_MINT
      );
      const root = CryptoHelper.numberArrayToBigInt(
        merkle.roots[merkle.currentRootIndex]
      );
      const pathElements: bigint[] = [];
      const pathIndices: (0 | 1)[] = [];
      for (const p of proof_path) {
        if (p.length > 2) {
          const is_left = p[2] == 0 ? 0 : 1;
          const index = is_left ? p[0] : p[1];
          const node = await getMerkleNodeAccount(
            program.provider.connection,
            depth,
            index
          );
          pathElements.push(CryptoHelper.numberArrayToBigInt(node.data));
          pathIndices.push(is_left);
        }
      }
      const nullifer = nullifers[j];
      const secret = secrets[j];
      const circuit_output = await run_circuit({
        root,
        nullifier: nullifer.num,
        secret: secret.num,
        circuit_name: CIRCUIT_NAME,
        recipient: signer.publicKey,
        pathElements,
        pathIndices,
      });
      const proof = Array.from(
        ZkHelper.convertProofToBytes(circuit_output.proof as any)
      );
      const nullifierHash = CryptoHelper.hash(
        CryptoHelper.numberArrayToU8IntArray(nullifer.u8Array)
      );
      const instruction = await buildWithdrawTransactionInstruction({
        mint: NATIVE_MINT,
        connection: program.provider.connection,
        signer: anonSigner.publicKey,
        nullifierHash,
        root: CryptoHelper.bigIntToNumberArray(root),
        proof,
        depth,
        recipient: signer.publicKey,
      });
      const sig = await processTransaction(
        [modifyComputeUnits, instruction],
        program.provider.connection,
        anonSigner
      );
      const txn = await program.provider.connection.getParsedTransaction(
        sig.Signature,
        "confirmed"
      );
      assert.equal(
        sig.SignatureResult.err,
        null,
        `${txn?.meta?.logMessages.join("\n")}`
      );
    }
  });
});
