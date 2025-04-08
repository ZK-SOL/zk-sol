import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  ClosePdaAccountInstructionAccounts,
  createClosePdaAccountInstruction,
  createCreateMerkleInstruction,
  createDepositInstruction,
  createDumpProofInstruction,
  CreateMerkleInstructionAccounts,
  CreateMerkleInstructionArgs,
  createWithdrawInstruction,
  DepositInstructionAccounts,
  DepositInstructionArgs,
  DumpProofInstructionAccounts,
  WithdrawInstructionAccounts,
  WithdrawInstructionArgs,
} from "../instructions";
import {
  getMerkleAccount,
  getMerkleAddress,
  getMerkleNodeAddress,
  getMerklePendingProofAddress,
  getMerkleTokenAddress,
  getMerkleZerosAddress,
  getNullifierHashAddress,
} from "../pda/merkle_pda";
import {
  getOrCreateTokenAccountInstruction,
  toAccountMeta,
} from "../sol-helpers";
import {
  MerklePendingProofState,
  merklePendingProofStateDiscriminator,
} from "../accounts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export type GenerateProofPath = number[][];

export type BuildCreateMerkleTransactionInstructionInputs = {
  signer: PublicKey;
  depth: number;
  depositSize: number;
  mint: PublicKey;
};

export function buildCreateMerkleTransactionInstruction({
  signer,
  depth,
  depositSize,
  mint,
}: BuildCreateMerkleTransactionInstructionInputs): TransactionInstruction {
  const [merkle] = getMerkleAddress(depth, mint);
  const [merkleZeros] = getMerkleZerosAddress(depth, mint);
  const [merkleTokenAccount] = getMerkleTokenAddress(depth, mint);

  const args: CreateMerkleInstructionArgs = {
    args: { depth, depositSize },
  };
  const accounts: CreateMerkleInstructionAccounts = {
    signer,
    merkle,
    merkleZeros,
    merkleTokenAccount,
    mint,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  };
  return createCreateMerkleInstruction(accounts, args);
}

export type BuildDepositTransactionInstructionInputs = {
  signer: PublicKey;
  input: number[];
  depth: number;
  connection: Connection;
  mint: PublicKey;
};

export async function buildDepositTransactionInstruction({
  signer,
  input,
  depth,
  connection,
  mint,
}: BuildDepositTransactionInstructionInputs): Promise<
  TransactionInstruction[]
> {
  const instructions: TransactionInstruction[] = [];
  const [merkle] = getMerkleAddress(depth, mint);
  const merkleAccount = await getMerkleAccount(connection, depth, mint);
  const [merkleTokenAccount] = getMerkleTokenAddress(depth, mint);
  const signerTokenAccount = getAssociatedTokenAddressSync(mint, signer);
  const getOrCreateInstruction = await getOrCreateTokenAccountInstruction(
    mint,
    signer,
    connection
  );
  if (getOrCreateInstruction) {
    instructions.push(getOrCreateInstruction);
  }

  const [merkleZeros] = getMerkleZerosAddress(depth, mint);
  const [pendingProof] = getMerklePendingProofAddress(
    depth,
    Number(merkleAccount.nextIndex),
    mint
  );
  const args: DepositInstructionArgs = {
    args: {
      input,
    },
  };
  const accounts: DepositInstructionAccounts = {
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    mint,
    merkleTokenAccount,
    signerTokenAccount,
    signer,
    merkle,
    merkleZeros,
    pendingProof,
  };
  instructions.push(createDepositInstruction(accounts, args));
  return instructions;
}

export type BuildWithdrawTransactionInstructionInputs = {
  signer: PublicKey;
  nullifierHash: number[];
  proof: number[];
  root: number[];
  recipient: PublicKey;
  depth: number;
  connection: Connection;
  mint: PublicKey;
};

export async function buildWithdrawTransactionInstruction({
  signer,
  nullifierHash,
  proof,
  root,
  recipient,
  depth,
  connection,
  mint,
}: BuildWithdrawTransactionInstructionInputs): Promise<TransactionInstruction> {
  const [merkle] = getMerkleAddress(depth, mint);
  const merkleAccount = await getMerkleAccount(connection, depth, mint);
  const [merkleTokenAccount] = getMerkleTokenAddress(depth, mint);
  const recipientTokenAccount = getAssociatedTokenAddressSync(mint, recipient);
  const [hash] = getNullifierHashAddress(depth, nullifierHash);
  const args: WithdrawInstructionArgs = {
    args: {
      nullifierHash,
      proof,
      root,
    },
  };
  const accounts: WithdrawInstructionAccounts = {
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    recipientTokenAccount,
    signer,
    merkle,
    recipient,
    nullifierHash: hash,
    merkleTokenAccount,
    mint,
  };
  return createWithdrawInstruction(accounts, args);
}

export type WithdrawCircuitInputs = {
  root: number | bigint; //
  commitment: number | bigint; // poseidon(nullifer, secret)
  nullifierHash: number | bigint; // poseidon(nullifer)
  recipient: number | bigint; // poseidon(PublicKey)
  nullifier: number | bigint;
  secret: number | bigint;
  pathElements: number[] | bigint[];
  pathIndices: number[] | bigint[];
};

export type BuildDumpProofTransactionInstructionsArrayInputs = {
  signer: PublicKey;
  connection: Connection;
  depth: number;
  mint: PublicKey;
};

export async function buildDumpProofTransactionInstructionsArray({
  signer,
  connection,
  depth,
  mint,
}: BuildDumpProofTransactionInstructionsArrayInputs): Promise<
  TransactionInstruction[]
> {
  const instructions: TransactionInstruction[] = [];
  const [merkle] = getMerkleAddress(depth, mint);
  const pendingProofs = await MerklePendingProofState.gpaBuilder()
    .addFilter("accountDiscriminator", merklePendingProofStateDiscriminator)
    .addFilter("depth", depth)
    .addFilter("mint", mint)
    .run(connection);
  const sortedPendingProofs = pendingProofs
    .map((i) => {
      return MerklePendingProofState.fromAccountInfo(i.account);
    })
    .sort((a, b) => {
      return Number(a[0].index) - Number(b[0].index);
    });
  for (const [proofAccount, _bump] of sortedPendingProofs) {
    const [pendingProof] = getMerklePendingProofAddress(
      depth,
      Number(proofAccount.index),
      mint
    );
    for (let i = 0; i < proofAccount.proof.path.length; i += 5) {
      const startIndex = i;
      const endIndex = startIndex + 5;
      const instruction = await buildDumpProofTransactionInstruction({
        signer,
        depth,
        startIndex,
        endIndex,
        merkle,
        pendingProof,
        proofAccount,
        mint,
      });
      instructions.push(instruction);
    }
  }
  return instructions;
}

export type BuildDumpProofTransactionInstructionInputs = {
  signer: PublicKey;
  depth: number;
  startIndex: number;
  endIndex: number;
  merkle: PublicKey;
  pendingProof: PublicKey;
  proofAccount: MerklePendingProofState;
  mint: PublicKey;
};

export async function buildDumpProofTransactionInstruction({
  signer,
  depth,
  startIndex,
  endIndex,
  merkle,
  pendingProof,
  proofAccount,
  mint,
}: BuildDumpProofTransactionInstructionInputs): Promise<TransactionInstruction> {
  const remainingAccounts: PublicKey[] = [];
  let counter = 0;
  for (let i = 0; i < proofAccount.proof.path.length; i++) {
    const node = proofAccount.proof.path[i];
    const [merkleNode] = getMerkleNodeAddress(depth, node.index as number);
    if (i < startIndex || i > endIndex) {
      continue;
    }
    remainingAccounts.push(merkleNode);
    counter += 1;
    if (counter >= 5) {
      break;
    }
  }
  const accounts: DumpProofInstructionAccounts = {
    mint,
    signer,
    merkle,
    pendingProof,
    anchorRemainingAccounts: remainingAccounts.map((i) =>
      toAccountMeta(i, true)
    ),
  };
  return createDumpProofInstruction(accounts);
}

export type BuildCloseMerkleTransactionInstructionInputs = {
  signer: PublicKey;
  account: PublicKey;
};

export function buildClosePdaAccountTransactionInstruction({
  signer,
  account,
}: BuildCloseMerkleTransactionInstructionInputs): TransactionInstruction {
  const accounts: ClosePdaAccountInstructionAccounts = {
    signer,
    account,
  };
  return createClosePdaAccountInstruction(accounts);
}
