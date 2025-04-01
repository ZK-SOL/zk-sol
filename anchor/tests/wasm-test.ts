import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {Zklsol} from "../target/types/zklsol";
import {MerkleNodeWasm} from "../solita/wasm-zklsol/zklsol";
import {CryptoHelper} from "../solita/crypto-helpers";
import {GenerateProofPath} from "../solita/wrappers/merkle_wrapper";
import assert from "assert";
import {areArraysEqual} from "../solita/generic-helpers";


describe("ZKL-$SOL - merkle test", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.Zklsol as Program<Zklsol>;
    const depth = 20;

    it("mod_input", async () => {
        let num = BigInt(1);
        for (let i = 0; i < 300; i++) {
            const n = num * BigInt(2);
            const x = CryptoHelper.modInput(CryptoHelper.bigIntToBytes32(n))
            const y = Array.from(MerkleNodeWasm.mod_input(CryptoHelper.bigIntToBytes32(n)));
            assert(areArraysEqual(x, y))
            num = num * BigInt(2) + BigInt(i);
            const x2 = CryptoHelper.modInput(CryptoHelper.bigIntToBytes32(num))
            const y2 = Array.from(MerkleNodeWasm.mod_input(CryptoHelper.bigIntToBytes32(num)));
            assert(areArraysEqual(x2, y2))
        }

    })

    it("constructor", async () => {
        let num = BigInt(1);
        for (let i = 0; i < 300; i++) {
            num = num * BigInt(2) + BigInt(i);
            const node = new MerkleNodeWasm(CryptoHelper.bigIntToBytes32(num));
            const x = CryptoHelper.modInput(CryptoHelper.bigIntToBytes32(num))
            const y = Array.from(node.get_hash);
            assert(areArraysEqual(x, y))
        }
    })

    it("from_children", async () => {
        let num = BigInt(1);
        for (let i = 0; i < 300; i++) {
            num = num * BigInt(2) + BigInt(i);
            const left = num + BigInt(Math.floor(150_000 * Math.random()));
            const right = num + BigInt(Math.floor(150_000 * Math.random()));
            const left_node = new MerkleNodeWasm(CryptoHelper.bigIntToBytes32(left));
            const right_node = new MerkleNodeWasm(CryptoHelper.bigIntToBytes32(right));
            const by_wasm = MerkleNodeWasm.from_children(left_node, right_node);
            const by_js = CryptoHelper.from_children(CryptoHelper.bigIntToBytes32(left), CryptoHelper.bigIntToBytes32(right));
            assert(areArraysEqual(by_js, Array.from(by_wasm.get_hash)));
        }
    })

    it("hash", async () => {
        let num = BigInt(1);
        for (let i = 0; i < 300; i++) {
            num = num * BigInt(2) + BigInt(i);
            const by_wasm = MerkleNodeWasm.hash(CryptoHelper.bigIntToBytes32(num));
            const by_js = CryptoHelper.hash(CryptoHelper.bigIntToBytes32(num));
            assert(areArraysEqual(by_js, Array.from(by_wasm.get_hash)));
        }
    })

    it("generate_proof", async () => {
        for (let i = 0; i < 300; i++) {
            const wasm_proof: GenerateProofPath = MerkleNodeWasm.generate_proof_path(depth, BigInt(i));
            const js_proof = CryptoHelper.generate_proof_path(depth, i);
            for (let j = 0; j < wasm_proof.length; j++) {
                const wasm_array = wasm_proof[j];
                const js_array = js_proof[j];
                assert(areArraysEqual(wasm_array, js_array), `not equal for ${i} | wasm_array = ${wasm_array} | js_array = ${js_array}`);
            }
        }
    })
});