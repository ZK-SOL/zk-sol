import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {Zklsol} from "../target/types/zklsol";
import {Keypair, LAMPORTS_PER_SOL} from "@solana/web3.js";
import assert from "assert";
import {airdrop, modifyComputeUnits, processTransaction} from "../solita/sol-helpers";
import {
    buildCreateMerkleTransactionInstruction,
} from "../solita/wrappers/merkle_wrapper";
import {getMerkleAccount, getMerklePendingProofAccount, getMerkleNodeAddress} from "../solita/pda/merkle_pda";
import {CryptoHelper} from "../solita/crypto-helpers";
import {run_circuit} from "../solita/zk-helper";

const signer = Keypair.generate()
const WITHDRAW_CIRCUIT_NAME = "withdraw3";
const secret = CryptoHelper.generateAndPrepareRand(123);
const nullifier = CryptoHelper.generateAndPrepareRand(456);

describe("withdraw3", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.Zklsol as Program<Zklsol>;
    const depth = 3;

    it("airdrop", async () => {
        for (const key of [signer]) {
            await airdrop(program, key.publicKey, LAMPORTS_PER_SOL * 50_000)
        }
    })

    it("create merkle", async () => {
        const instruction = buildCreateMerkleTransactionInstruction({
            signer: signer.publicKey,
            depth,
            depositSize: LAMPORTS_PER_SOL
        })
        const sig = await processTransaction(
            [modifyComputeUnits, instruction],
            program.provider.connection,
            signer
        )
        const txn = await program.provider.connection.getParsedTransaction(
            sig.Signature,
            'confirmed'
        )
        assert.equal(
            sig.SignatureResult.err,
            null,
            `${txn?.meta?.logMessages.join('\n')}`
        )
        const merkle = await getMerkleAccount(program.provider.connection, depth);
        for (const r of merkle.roots) {
            // console.log("create merkle r = ", CryptoHelper.numberArrayToBigInt(r))
        }
        for (const f of merkle.filledSubTrees) {
            // console.log("create merkle f = ", CryptoHelper.numberArrayToBigInt(f))
        }
    })

    it("add to merkle", async () => {
        // const poseidon = await circomlibjs.buildPoseidon();
        const commitmentBytes = CryptoHelper.from_children(CryptoHelper.bigIntToBytes32(BigInt(nullifier.num)), CryptoHelper.bigIntToBytes32(BigInt(nullifier.num)));
        const commitmentBigInt = CryptoHelper.numberArrayToBigInt(commitmentBytes);
        for (let j = 0; j < 2; j++) {
            const merkle = await getMerkleAccount(program.provider.connection, depth);
            const leaf = await getMerklePendingProofAccount(program.provider.connection, depth);
            console.log("leaf", leaf)
            const d = CryptoHelper.numberArrayToBigInt(leaf.data)
            assert(d == commitmentBigInt)
            const pathElements = leaf.proof.path.map((p) => CryptoHelper.numberArrayToBigInt(p.node.hash));
            const root = pathElements.pop();
            const pathIndices = leaf.proof.path.map((p) => p.isLeft ? 0 : 1);
            pathIndices.pop();
            console.log("root = ", root)
            console.log("pathElements = ", pathElements)
            console.log("pathIndices = ", pathIndices)
            console.log("recipient = ", signer.publicKey)
            const output = await run_circuit({
                root,
                nullifier: nullifier.num,
                secret: secret.num,
                circuit_name: WITHDRAW_CIRCUIT_NAME,
                recipient: signer.publicKey,
                pathElements,
                pathIndices
            })
            console.log("3333", output)
        }
    })

    it("withdraw from merkle", async () => {
    })
})


