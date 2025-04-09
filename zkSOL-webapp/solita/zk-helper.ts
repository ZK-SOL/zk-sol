// @ts-nocheck
import { CryptoHelper, CryptoNumber } from "./crypto-helpers";
import * as snarkjs from "snarkjs";
import { WithdrawCircuitInputs } from "./wrappers/merkle_wrapper";
import { PublicKey } from "@solana/web3.js";
import assert from "assert";
import { buildBn128, utils } from "ffjavascript";

const { unstringifyBigInts } = utils;

export type ZKProof = {
  pi_a: bigint[];
  pi_b: bigint[][];
  pi_c: bigint[];
};

export type PrepCommitmentInputs = {
  root: bigint;
  recipient: PublicKey;
  nullifier: number;
  secret: number;
  circuit_name: string;
  pathElements: bigint[];
  pathIndices: (0 | 1)[];
};

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.document !== "undefined"
  );
}

export async function run_circuit({
  root,
  nullifier,
  secret,
  circuit_name,
  recipient,
  pathElements,
  pathIndices,
}: PrepCommitmentInputs) {
  const circuit_wasm = isBrowser()
    ? `/${circuit_name}.wasm`
    : `./circuits-output/${circuit_name}/${circuit_name}_js/${circuit_name}.wasm`;
  const circuit_zkey = isBrowser()
    ? `/${circuit_name}_final.zkey`
    : `./circuits-output/${circuit_name}/${circuit_name}_final.zkey`;
  const nullifierU8Array = CryptoHelper.reverseUint8Array(
    CryptoHelper.numberToUint8Array(nullifier)
  );
  const secretU8Array = CryptoHelper.reverseUint8Array(
    CryptoHelper.numberToUint8Array(secret)
  );
  const nullifierMod = CryptoHelper.modInput(nullifierU8Array);
  const secretMod = CryptoHelper.modInput(secretU8Array);
  const commitmentBytes = CryptoHelper.from_children(nullifierMod, secretMod);
  const commitmentBigInt = CryptoHelper.numberArrayToBigInt(commitmentBytes);
  const nullifierHashBytes = CryptoHelper.hash(nullifierU8Array);
  const nullifierHashBigInt =
    CryptoHelper.numberArrayToBigInt(nullifierHashBytes);
  const nullifierBigIntMod = CryptoHelper.numberArrayToBigInt(nullifierMod);
  const secretBigIntMod = CryptoHelper.numberArrayToBigInt(secretMod);
  const recipientU8Array = Array.from(recipient.toBuffer());
  const recipientBigInt = CryptoHelper.numberArrayToBigInt(recipientU8Array);
  const recipientNum = CryptoNumber.from_num(recipientBigInt);
  const input_node: WithdrawCircuitInputs = {
    root: root,
    commitment: commitmentBigInt,
    nullifierHash: nullifierHashBigInt,
    nullifier: nullifierBigIntMod,
    secret: secretBigIntMod,
    // Path elements are the sibling nodes needed to reconstruct the path
    pathElements: pathElements, // Siblings at each level
    pathIndices: pathIndices, // 0 means we're on the left at each level
    recipient: recipientNum.bigInt,
  };
  let { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input_node,
    circuit_wasm,
    circuit_zkey
  );
  publicSignals = unstringifyBigInts(publicSignals);
  const publicSignalsBuffer_0 = CryptoHelper.to32ByteBuffer(
    BigInt(publicSignals[0])
  );
  let public_signal_0_u8_array_0 = Array.from(publicSignalsBuffer_0);
  const publicSignalsBuffer_1 = CryptoHelper.to32ByteBuffer(
    BigInt(publicSignals[1])
  );
  let public_signal_0_u8_array_1 = Array.from(publicSignalsBuffer_1);
  assert(
    CryptoHelper.compareArrays(recipientNum.mod, [
      ...public_signal_0_u8_array_0,
    ])
  );
  assert(
    CryptoHelper.compareArrays(nullifierHashBytes, [
      ...public_signal_0_u8_array_1,
    ])
  );
  return { proof, publicSignals };
}

export class ZkHelper {
  /**
   * `convertProofToBytes` converts a zk-SNARK proof to a byte array.
   * @param proof
   * @returns Uint8Array
   */
  static convertProofToBytes(proof: ZKProof): Uint8Array {
    // Convert pi_a components
    const pi_a = [
      CryptoHelper.bigIntToBytes32(proof.pi_a[0]),
      CryptoHelper.bigIntToBytes32(proof.pi_a[1]),
    ];

    // Convert pi_b components (note the reversed order within pairs)
    const pi_b = [
      // First pair
      CryptoHelper.bigIntToBytes32(proof.pi_b[0][1]), // Reversed order
      CryptoHelper.bigIntToBytes32(proof.pi_b[0][0]),
      // Second pair
      CryptoHelper.bigIntToBytes32(proof.pi_b[1][1]), // Reversed order
      CryptoHelper.bigIntToBytes32(proof.pi_b[1][0]),
    ];
    // Convert pi_c components
    const pi_c = [
      CryptoHelper.bigIntToBytes32(proof.pi_c[0]),
      CryptoHelper.bigIntToBytes32(proof.pi_c[1]),
    ];
    // Concatenate all components
    return CryptoHelper.concatenateUint8Arrays([...pi_a, ...pi_b, ...pi_c]);
  }

  static g1Uncompressed(curve: any, p1Raw: any): Buffer {
    let p1 = curve.G1.fromObject(p1Raw);

    let buff = new Uint8Array(64); // 64 bytes for G1 uncompressed
    curve.G1.toRprUncompressed(buff, 0, p1);

    return Buffer.from(buff);
  }

  static g2Uncompressed(curve: any, p2Raw: any): Buffer {
    let p2 = curve.G2.fromObject(p2Raw);

    let buff = new Uint8Array(128); // 128 bytes for G2 uncompressed
    curve.G2.toRprUncompressed(buff, 0, p2);

    return Buffer.from(buff);
  }
}
