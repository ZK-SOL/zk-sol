import {sha256} from '@noble/hashes/sha256';
import {poseidon1, poseidon2} from 'poseidon-lite'
import {GenerateProofPath} from "./wrappers/merkle_wrapper";


export type Rand = {
    num: number;
    u8Array: number[];
}

export class CryptoNumber {
    bigInt: bigint;
    u8Array: Uint8Array;
    mod: number[];

    static from_num(n: number | bigint): CryptoNumber {
        const bigInt = typeof n === "bigint" ? n : BigInt(n);
        const u8Array = CryptoHelper.bigIntToBytes32(bigInt);
        const mod = CryptoHelper.modInput(u8Array);
        return {
            bigInt,
            u8Array,
            mod
        }
    }
}

export class CryptoHelper {
    static parent_index(i: number, height: number): number | undefined {
        // Total nodes in the tree: 2^(H+1) - 1
        let total_nodes = Math.pow(2, height + 1) - 1;
        // Root index: 2^(H+1) - 2
        let root_index = total_nodes - 1;

        // If i is the root, it has no parent
        if (i == root_index) {
            return undefined;
        }
        // Check if i is a valid index
        if (i >= total_nodes) {
            return undefined;
        }

        // Calculate the level L of node i
        // L = floor(log2(i + 2^H)) - H
        let leaf_start = Math.pow(2, height);// 2^H, start of leaf level
        let level = Math.log2(i + leaf_start) - height;
        // Calculate parent index
        // p = (2^(H+1) - 2^(H-L)) + floor((i - (2^(H+1) - 2^(H-L+1))) / 2)
        let nodes_up_to_next_level = Math.pow(2, height + 1) - Math.pow(2, height - level);
        let nodes_up_to_current_level = Math.pow(2, height + 1) - Math.pow(2, height - level + 1);
        let offset = i - nodes_up_to_current_level;
        return Math.floor(nodes_up_to_next_level + (offset / 2));
    }

    static generate_proof_path(depth: number, index: number): GenerateProofPath {
        const total_nodes = Math.pow(2, depth) - 2;
        const path: GenerateProofPath = [];
        let absolute_current_index = index;
        for (let i = 0; i < depth; i++) {
            let is_left = absolute_current_index % 2 == 0;
            let sibling_index = is_left ? absolute_current_index + 1 : absolute_current_index - 1;
            if (absolute_current_index >= total_nodes) {
                path.push([absolute_current_index]);
            } else if (absolute_current_index % 2 == 0) {
                path.push([absolute_current_index, sibling_index, 0]);
            } else {
                path.push([sibling_index, absolute_current_index, 1]);
            }
            const parent = CryptoHelper.parent_index(absolute_current_index, depth - 1);
            if (parent) {
                absolute_current_index = parent;
            }
        }
        return path;
    }


    static zeros(depth: number): Map<number, number[]> {
        const data = new TextEncoder().encode("ZKL$SOL");
        const leaf = CryptoHelper.hash(data);
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
        return levels;
    }


    static hash(data: number[] | Uint8Array): number[] {
        const data_mod = CryptoHelper.numberArrayToBigInt(CryptoHelper.modInput(Array.from(data)));
        const hash = poseidon1([data_mod]);
        return Array.from(CryptoHelper.bigIntToBytes32(hash));
    }

    static from_children(left: number[] | Uint8Array, right: number[] | Uint8Array): number[] {
        const left_mod = CryptoHelper.numberArrayToBigInt(CryptoHelper.modInput(Array.from(left)));
        const right_mod = CryptoHelper.numberArrayToBigInt(CryptoHelper.modInput(Array.from(right)));
        const hash = poseidon2([left_mod, right_mod]);
        return Array.from(CryptoHelper.bigIntToBytes32(hash));
    }

    static compareArrays(a: number[], b: number[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * `reverseUint8Array` - Reverses a Uint8Array
     * @param u8Array
     * @returns Uint8Array
     */
    static reverseUint8Array(u8Array: Uint8Array): Uint8Array {
        return new Uint8Array(u8Array.slice().reverse());
    }

    /**
     * `generateAndPrepareRand` - Generates a random number and prepares it for use
     * @param input - Optional input number
     * @returns Rand
     */
    static generateAndPrepareRand(input?: number): Rand {
        const num: number = input ? input : Math.floor(Math.random() * 256_000_000 + 256);
        const u8Array = CryptoHelper.numberToUint8Array(num);
        const u8ArrayReverse: number[] = Array.from(u8Array).reverse();
        return {
            num,
            u8Array: u8ArrayReverse
        }
    }

    /**
     * `u8IntArrayToNumberArray` - Converts a Uint8Array to an array of numbers
     * @param u8IntArray
     */
    static u8IntArrayToNumberArray(u8IntArray: Uint8Array): number[] {
        return Array.from(u8IntArray)
    }

    /**
     * `concatenateUint8Arrays` - Concatenates multiple Uint8Arrays into a single Uint8Array
     * @param arrays to concatenate
     * @returns Uint8Array
     */
    static concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
        // Calculate total length
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        // Create new array with total length
        const result = new Uint8Array(totalLength);
        // Copy each array into result
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    /**
     * `to32ByteBuffer` - Converts BigInt to Buffer
     * @param bigInt - BigInt
     * @returns Buffer
     */
    static to32ByteBuffer(bigInt): Buffer {
        const hexString = bigInt.toString(16).padStart(64, '0');
        return Buffer.from(hexString, "hex");
    }

    /**
     * `bigIntToBytes32` - Converts BitInt to Uint8Array
     * @param num - BigInt
     * @returns Uint8Array
     */
    static bigIntToBytes32(num: bigint): Uint8Array {
        // Convert BigInt to 32-byte hex string
        let hex = BigInt(num).toString(16);
        // Pad to 64 characters (32 bytes)
        hex = hex.padStart(64, '0');
        // Convert hex string to Uint8Array
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
        }
        return bytes;
    }

    /**
     * `modInput` - Calculate the number modulo the order
     * @param input - Input number as an array of bytes ([u8;32])
     * @param order - The curve order , optional
     * @returns The number modulo the order
     */
    static modInput(input: number[] | Uint8Array, order?: string | bigint): number[] {
        // BN254 curve order is the default
        const ORDER = BigInt(order || "21888242871839275222246405745257275088548364400416034343698204186575808495617");
        // Convert input to Uint8Array if it's not already
        const inputArray = Array.from(input);

        // Create a 32-byte array
        const data = new Array(32).fill(0);
        const len = Math.min(inputArray.length, 32);
        for (let i = 0; i < len; i++) {
            data[i] = inputArray[i];
        }

        // Reverse bytes for big-endian input
        data.reverse();

        // Convert to BigInt (simulating Fr::from_le_bytes_mod_order)
        let value = BigInt(0);
        for (let i = 0; i < data.length; i++) {
            value += BigInt(data[i]) << BigInt(8 * i);
        }

        // Apply modulo
        value = value % ORDER;
        if (value < BigInt(0)) {
            value += ORDER;
        }

        // Convert back to bytes (32 bytes, big-endian)
        const result = new Array(32).fill(0);
        let tempValue = value;
        for (let i = 31; i >= 0; i--) {
            result[i] = Number(tempValue & BigInt(255));
            tempValue = tempValue >> BigInt(8);
        }

        return result;
    }

    /**
     * `bigIntToNumberArray` - Convert BigInt to an array of bytes
     * @param value - BigInt input
     * @param length - Desired length of the output array (default: 32)
     * @returns Array of bytes
     */
    static bigIntToNumberArray(value: bigint, length: number = 32): number[] {
        const hex = value.toString(16).padStart(length * 2, '0');
        const numbers: number[] = [];

        for (let i = 0; i < hex.length; i += 2) {
            numbers.push(parseInt(hex.slice(i, i + 2), 16));
        }

        // Pad array to desired length if necessary
        while (numbers.length < length) {
            numbers.unshift(0);
        }

        // Truncate if longer than desired length
        if (numbers.length > length) {
            numbers.splice(0, numbers.length - length);
        }

        return numbers;
    }

    /**
     * `numberArrayToU8IntArray` - Convert an array of bytes to a Uint8Array
     * @param input - array of numbers
     * @returns Uint8Array
     */
    static numberArrayToU8IntArray(input: number[]): Uint8Array {
        return new Uint8Array(input)
    }

    /**
     * `numberToUint8Array` - Convert a number to a Uint8Array of 32 bytes
     * @param num - the number to convert
     * @returns Uint8Array
     */
    static numberToUint8Array(num: number): Uint8Array {
        const arr = new Array(32).fill(0);
        let index = 31; // Start from the end

        // Convert number to bytes
        while (num > 0 && index >= 0) {
            arr[index] = num & 255; // Get least significant byte
            num >>>= 8; // Unsigned right shift by 8 bits
            index--;
        }

        return new Uint8Array(arr);
    }

    /**
     * `sha256digest` - SHA256 of a number array, as a Uint8Array
     * @param input
     */
    static sha256digest(input: number[]): Uint8Array {
        const data: Uint8Array = new Uint8Array(input)
        return sha256(data);
    }

    /**
     * `numberArrayToBigInt` - Converts number array or Uint8Array, to BigInt , supports BE/LE
     * @param arr - number array
     * @param reverse - optional change LE/BE
     * @returns BigInt
     */
    static numberArrayToBigInt(arr: number[] | Uint8Array, reverse?: boolean): bigint {
        const array: number[] = typeof arr === "object" ? Array.from(arr) : arr
        if (reverse) {
            // @ts-ignore
            return array.reverse().reduce((acc, num) => (acc << BigInt(8)) | BigInt(num), BigInt(0));
        } else {
            // @ts-ignore
            return array.reduce((acc, num) => (acc << BigInt(8)) | BigInt(num), BigInt(0));
        }
    }
}
