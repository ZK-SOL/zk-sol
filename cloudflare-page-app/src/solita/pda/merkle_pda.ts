import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  MerkleState,
  PROGRAM_ID,
  MerkleZeros,
  MerkleNodeState,
  MerklePendingProofState,
  NullifierHash,
} from "../index";
import {
  MerkleNodeSeed,
  MerklePendingProofSeed,
  MerkleSeed,
  MerkleZerosSeed,
  NullifierHashSeed,
} from "../constants/seeds";
import BN from "bn.js";
import { CryptoHelper } from "../crypto-helpers";

export function getMerkleAddress(
  depth: number,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(MerkleSeed)),
      mint.toBuffer(),
      new BN(depth).toBuffer("le", 8),
    ],
    PROGRAM_ID
  );
}

export async function getMerkleAccount(
  connection: Connection,
  depth: number,
  mint: PublicKey
): Promise<MerkleState> {
  const [merkle] = getMerkleAddress(depth, mint);
  return await MerkleState.fromAccountAddress(connection, merkle);
}

export function getMerkleTokenAddress(
  depth: number,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(MerkleSeed)),
      mint.toBuffer(),
      new BN(depth).toBuffer("le", 8),
    ],
    PROGRAM_ID
  );
}

export function getMerklePendingProofAddress(
  depth: number,
  index: number,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(MerklePendingProofSeed)),
      mint.toBuffer(),
      new BN(depth).toBuffer("le", 8),
      new BN(index).toBuffer("le", 8),
    ],
    PROGRAM_ID
  );
}

export async function getMerklePendingProofAccount(
  connection: Connection,
  depth: number,
  index: number,
  mint: PublicKey
): Promise<MerklePendingProofState> {
  const [leaf] = getMerklePendingProofAddress(depth, index, mint);
  return await MerklePendingProofState.fromAccountAddress(connection, leaf);
}

export function getMerkleZerosAddress(
  depth: number,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(MerkleZerosSeed)),
      mint.toBuffer(),
      new BN(depth).toBuffer("le", 8),
    ],
    PROGRAM_ID
  );
}

export async function getMerkleZerosAccount(
  connection: Connection,
  depth: number,
  mint: PublicKey
): Promise<MerkleZeros> {
  const [merkle] = getMerkleZerosAddress(depth, mint);
  return await MerkleZeros.fromAccountAddress(connection, merkle);
}

export function getMerkleNodeAddress(
  depth: number,
  index: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(MerkleNodeSeed)),
      new BN(depth).toBuffer("le", 8),
      new BN(index).toBuffer("le", 8),
    ],
    PROGRAM_ID
  );
}

export async function getMerkleNodeAccount(
  connection: Connection,
  depth: number,
  index: number
): Promise<MerkleNodeState> {
  const [merkle] = getMerkleNodeAddress(depth, index);
  return await MerkleNodeState.fromAccountAddress(connection, merkle);
}

export function getNullifierHashAddress(
  depth: number,
  nullifier_hash: number[]
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(NullifierHashSeed)),
      new BN(depth).toBuffer("le", 8),
      Buffer.from(nullifier_hash),
    ],
    PROGRAM_ID
  );
}

export async function getNullifierHashAccount(
  connection: Connection,
  depth: number,
  nullifier_hash: number[]
): Promise<NullifierHash> {
  const [hash] = getNullifierHashAddress(depth, nullifier_hash);
  return await NullifierHash.fromAccountAddress(connection, hash);
}

export async function isgNullifierHashUsed(
  connection: Connection,
  nullifier_hash: number[]
): Promise<boolean> {
  const accounts = await NullifierHash.gpaBuilder()
    .addFilter("nullifierHash", nullifier_hash)
    .run(connection);
  return accounts.length > 0;
}
