import {CryptoHelper} from "../solita/crypto-helpers";
import {WithdrawCircuitInputs} from "../solita/wrappers/merkle_wrapper";
import * as snarkjs from "snarkjs";
// @ts-ignore
import * as circomlibjs from "circomlibjs";
import assert from "assert";
import {MerkleNodeWasm} from "../solita/wasm-zklsol/zklsol";

const COMMITMENT_CIRCUIT_NAME = "commitment-wrapper";
const COMMITMENT_CIRCUIT_WASM = `./circuits-output/${COMMITMENT_CIRCUIT_NAME}/${COMMITMENT_CIRCUIT_NAME}_js/${COMMITMENT_CIRCUIT_NAME}.wasm`;
const COMMITMENT_CIRCUIT_ZKEY = `./circuits-output/${COMMITMENT_CIRCUIT_NAME}/${COMMITMENT_CIRCUIT_NAME}_final.zkey`;
const WITHDRAW_CIRCUIT_NAME = "withdraw3";
const WITHDRAW_CIRCUIT_WASM = `./circuits-output/${WITHDRAW_CIRCUIT_NAME}/${WITHDRAW_CIRCUIT_NAME}_js/${WITHDRAW_CIRCUIT_NAME}.wasm`;
const WITHDRAW_CIRCUIT_ZKEY = `./circuits-output/${WITHDRAW_CIRCUIT_NAME}/${WITHDRAW_CIRCUIT_NAME}_final.zkey`;
const secret = CryptoHelper.generateAndPrepareRand(123);
const nullifier = CryptoHelper.generateAndPrepareRand(456);

describe("crypto tests", () => {
    it("mod test", async () => {
        let num = BigInt(2);
        for (let power = 1; power < 254; power++) {
            num = num * BigInt(2);
            const numAsArray = CryptoHelper.bigIntToNumberArray(num)
            const mod = CryptoHelper.modInput(numAsArray)
            const modBigInt = CryptoHelper.numberArrayToBigInt(mod)
            const modWasm = CryptoHelper.modInput(CryptoHelper.numberArrayToU8IntArray(mod))
            const modWasmBigInt = CryptoHelper.numberArrayToBigInt(Array.from(modWasm))
            assert(modBigInt === modWasmBigInt)
        }
    })

    it("Commitment", async () => {
        // const nullifierNodeWasm = new MerkleNodeWasm(CryptoHelper.numberArrayToU8IntArray(nullifier.u8Array));
        // const nullifierModWasm = MerkleNodeWasm.mod_input(CryptoHelper.numberArrayToU8IntArray(nullifier.u8Array));
        // const secretNodeWasm = new MerkleNodeWasm(CryptoHelper.numberArrayToU8IntArray(secret.u8Array));
        // const secretModWasm = MerkleNodeWasm.mod_input(CryptoHelper.numberArrayToU8IntArray(secret.u8Array));
        // const commitmentWasm = MerkleNodeWasm.from_children(nullifierNodeWasm, secretNodeWasm);
        // const commitmentBytesWasm = Array.from(commitmentWasm.get_hash);
        // const commitmentBigIntWasm = CryptoHelper.numberArrayToBigInt(commitmentBytesWasm);
        // const nullifierBigIntModWasm = CryptoHelper.numberArrayToBigInt(nullifierModWasm);
        // const secretBigIntModWasm = CryptoHelper.numberArrayToBigInt(secretModWasm);
        //
        const nullifierMod = CryptoHelper.modInput(CryptoHelper.numberArrayToU8IntArray(nullifier.u8Array));
        const secretMod = CryptoHelper.modInput(CryptoHelper.numberArrayToU8IntArray(secret.u8Array));
        const commitmentBytes = CryptoHelper.from_children(nullifierMod, secretMod);
        const commitmentBigInt = CryptoHelper.numberArrayToBigInt(commitmentBytes);
        const nullifierBigIntMod = CryptoHelper.numberArrayToBigInt(nullifierMod);
        const secretBigIntMod = CryptoHelper.numberArrayToBigInt(secretMod);
        const input_commitment = {
            nullifier: nullifierBigIntMod,
            secret: secretBigIntMod,
        };
        let {
            proof,
            publicSignals
        } = await snarkjs.groth16.fullProve(input_commitment, COMMITMENT_CIRCUIT_WASM, COMMITMENT_CIRCUIT_ZKEY);
        // assert(nullifierBigIntModWasm === nullifierBigIntMod);
        // assert(secretBigIntModWasm === secretBigIntMod)
        assert(commitmentBigInt === BigInt(publicSignals[0]))
    })

    it("Recreate zeros", async () => {
        // Create initial leaf node from "ZKL$SOL" bytes
        const data = new TextEncoder().encode("ZKL$SOL");
        const leaf = CryptoHelper.hash(data);

        const depth = 3;
        const levels = new Map<number, number[]>();
        let currentNode = leaf;

        // Generate cache levels
        for (let i = 0; i < depth; i++) {
            let level;
            if (i == 0) {
                level = currentNode;
                levels.set(i, currentNode);
            } else {
                level = CryptoHelper.from_children(currentNode, currentNode);
                levels.set(i, level);
            }
            currentNode = level;
        }
        for (const [k, v] of levels.entries()) {
            // console.log("level = ", k, " hash = ", CryptoHelper.numberArrayToBigInt(v.get_hash));
        }
    })

    it("3 level merkle tree test", async () => {
        const data = new TextEncoder().encode("ZKL$SOL");
        const zero = CryptoHelper.hash(data);
        const node0 = zero;
        const node1 = zero;
        const node2 = zero;
        const node3 = zero;
        const node4 = CryptoHelper.from_children(node0, node1);
        const node5 = CryptoHelper.from_children(node2, node3);
        const node6 = CryptoHelper.from_children(node4, node5);

        // console.log("node0 = ", numberArrayToBigInt(node0.get_hash));
        // console.log("node1 = ", numberArrayToBigInt(node1.get_hash));
        // console.log("node2 = ", numberArrayToBigInt(node2.get_hash));
        // console.log("node3 = ", numberArrayToBigInt(node3.get_hash));
        // console.log("node4 = ", numberArrayToBigInt(node4.get_hash));
        // console.log("node5 = ", numberArrayToBigInt(node5.get_hash));
        // console.log("node6 = ", numberArrayToBigInt(node6.get_hash));

        const nullifierNode = CryptoHelper.modInput(nullifier.u8Array);
        const secretNode = CryptoHelper.modInput(secret.u8Array);
        const commitment = CryptoHelper.from_children(nullifierNode, secretNode);
        const node_4 = CryptoHelper.from_children(commitment, node1);
        const node_5 = CryptoHelper.from_children(node2, node3);
        const node_6 = CryptoHelper.from_children(node_4, node_5);

        // console.log("--------------")
        //console.log("node_0 = ", numberArrayToBigInt(commitment.get_hash));
        //console.log("node_1 = ", numberArrayToBigInt(node1.get_hash));
        //console.log("node_2 = ", numberArrayToBigInt(node2.get_hash));
        //console.log("node_3 = ", numberArrayToBigInt(node3.get_hash));
        //console.log("node_4 = ", numberArrayToBigInt(node_4.get_hash));
        //console.log("node_5 = ", numberArrayToBigInt(node_5.get_hash));
        //console.log("node_6 = ", numberArrayToBigInt(node_6.get_hash));
    })

    it("Small merkle tree test - node0", async () => {
        //   top-down  | bottom-up
        //     0       |    6
        //  1    2     |  4   5
        // 3 4  5 6    | 0 1 2 3
        const poseidon = await circomlibjs.buildPoseidon();
        // using bottom-up schema
        const zeroLeaf = poseidon.F.toString(poseidon([0]));  // First level zero value
        // Create first leaf (commitment) from nullifier and secret
        const commitment = poseidon.F.toString(poseidon([nullifier.num, secret.num]));
        const node0 = commitment;
        const node1 = zeroLeaf;
        const node2 = zeroLeaf;
        const node3 = zeroLeaf;
        const node4 = poseidon.F.toString(poseidon([node0, node1]));
        const node5 = poseidon.F.toString(poseidon([node2, node3]))
        const node6 = poseidon.F.toString(poseidon([node4, node5]));
        const root = node6;
        // Calculate nullifier hash
        const nullifierHash = poseidon.F.toString(poseidon([nullifier.num]));
        // Prepare circuit inputs
        const input_node0: WithdrawCircuitInputs = {
            root: root,
            commitment: commitment,
            nullifierHash: nullifierHash,
            nullifier: nullifier.num,
            secret: secret.num,
            // Path elements are the sibling nodes needed to reconstruct the path
            pathElements: [node1, node5],  // Siblings at each level
            pathIndices: [0, 0],  // 0 means we're on the left at each level
            recipient: 1
        };


        // Generate and verify the proof
        // @ts-ignore
        await snarkjs.groth16.fullProve(input_node0, WITHDRAW_CIRCUIT_WASM, WITHDRAW_CIRCUIT_ZKEY);
    })

    it("Small merkle tree test - node1", async () => {
        //   top-down  | bottom-up
        //     0       |    6
        //  1    2     |  4   5
        // 3 4  5 6    | 0 1 2 3
        const poseidon = await circomlibjs.buildPoseidon();
        // using bottom-up schema
        const zeroLeaf = poseidon.F.toString(poseidon([0]));  // First level zero value
        // Create first leaf (commitment) from nullifier and secret
        const commitment = poseidon.F.toString(poseidon([nullifier.num, secret.num]));
        const node0 = commitment;
        const node1 = commitment;
        const node2 = zeroLeaf;
        const node3 = zeroLeaf;
        const node4 = poseidon.F.toString(poseidon([node0, node1]));
        const node5 = poseidon.F.toString(poseidon([node2, node3]))
        const node6 = poseidon.F.toString(poseidon([node4, node5]));
        const root = node6;
        // Calculate nullifier hash
        const nullifierHash = poseidon.F.toString(poseidon([nullifier.num]));
        // Prepare circuit inputs
        const input_node0: WithdrawCircuitInputs = {
            root: root,
            commitment: commitment,
            nullifierHash: nullifierHash,
            nullifier: nullifier.num,
            secret: secret.num,
            // Path elements are the sibling nodes needed to reconstruct the path
            pathElements: [node0, node5],  // Siblings at each level
            pathIndices: [1, 0],  // 0 means we're on the left at each level
            recipient: 1
        };
        // Generate and verify the proof
        // @ts-ignore
        await snarkjs.groth16.fullProve(input_node0, WITHDRAW_CIRCUIT_WASM, WITHDRAW_CIRCUIT_ZKEY);
    })
})