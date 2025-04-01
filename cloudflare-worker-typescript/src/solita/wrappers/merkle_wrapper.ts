import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {
    CloseMerkleInstructionAccounts, createCloseMerkleInstruction,
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
    getMerkleZerosAddress, getNullifierHashAddress
} from "../pda/merkle_pda";
import {toAccountMeta} from "../sol-helpers";
import {MerklePendingProofState, merklePendingProofStateDiscriminator} from "../accounts";

export type GenerateProofPath = number[][];

export type BuildCreateMerkleTransactionInstructionInputs = {
    signer: PublicKey;
    depth: number;
    depositSize: number;
}

export function buildCreateMerkleTransactionInstruction(
    {signer, depth, depositSize}: BuildCreateMerkleTransactionInstructionInputs
): TransactionInstruction {
    const [merkle] = getMerkleAddress(depth);
    const [merkleZeros] = getMerkleZerosAddress(depth);
    const args: CreateMerkleInstructionArgs = {
        args: {depth, depositSize}
    }
    const accounts: CreateMerkleInstructionAccounts = {
        signer,
        merkle,
        merkleZeros
    }
    return createCreateMerkleInstruction(accounts, args)
}


export type BuildDepositTransactionInstructionInputs = {
    signer: PublicKey;
    input: number[];
    depth: number;
    connection: Connection
}

export async function buildDepositTransactionInstruction({
                                                             signer,
                                                             input,
                                                             depth,
                                                             connection
                                                         }: BuildDepositTransactionInstructionInputs): Promise<TransactionInstruction> {
    const [merkle] = getMerkleAddress(depth);
    const merkleAccount = await getMerkleAccount(connection, depth);
    const [merkleZeros] = getMerkleZerosAddress(depth);
    const [pendingProof] = getMerklePendingProofAddress(depth, Number(merkleAccount.nextIndex));
    const args: DepositInstructionArgs = {
        args: {
            input
        }
    }
    const accounts: DepositInstructionAccounts = {
        signer,
        merkle,
        merkleZeros,
        pendingProof
    }
    return createDepositInstruction(accounts, args)
}

export type BuildWithdrawTransactionInstructionInputs = {
    signer: PublicKey;
    nullifierHash: number[];
    proof: number[];
    root: number[];
    recipient: PublicKey;
    depth: number;
}

export function buildWithdrawTransactionInstruction({
                                                        signer,
                                                        nullifierHash,
                                                        proof,
                                                        root,
                                                        recipient,
                                                        depth
                                                    }: BuildWithdrawTransactionInstructionInputs): TransactionInstruction {
    const [merkle] = getMerkleAddress(depth);
    const [hash] = getNullifierHashAddress(depth, nullifierHash);
    const args: WithdrawInstructionArgs = {
        args: {
            nullifierHash,
            proof,
            root,
        }
    }
    const accounts: WithdrawInstructionAccounts = {
        signer,
        merkle,
        recipient,
        nullifierHash: hash,

    }
    return createWithdrawInstruction(accounts, args)
}

export type WithdrawCircuitInputs = {
    root: number | bigint; //
    commitment: number | bigint; // poseidon(nullifer, secret)
    nullifierHash: number | bigint // poseidon(nullifer)
    recipient: number | bigint; // poseidon(PublicKey)
    nullifier: number | bigint;
    secret: number | bigint;
    pathElements: number[] | bigint[];
    pathIndices: number[] | bigint[];
}

export type BuildDumpProofTransactionInstructionsArrayInputs = {
    signer: PublicKey;
    connection: Connection;
    depth: number;
}

export async function buildDumpProofTransactionInstructionsArray({
                                                                     signer,
                                                                     connection,
                                                                     depth,
                                                                 }: BuildDumpProofTransactionInstructionsArrayInputs): Promise<TransactionInstruction[]> {
    const instructions: TransactionInstruction[] = [];
    const [merkle] = getMerkleAddress(depth);
    const pendingProofs = await MerklePendingProofState.gpaBuilder().addFilter("accountDiscriminator", merklePendingProofStateDiscriminator).addFilter("depth", depth).run(connection);
    const sorrtedPendingProofs = pendingProofs.map((i) => {
        return MerklePendingProofState.fromAccountInfo(i.account)
    })
        .sort((a, b) => {
            return Number(a[0].index) - Number(b[0].index)
        });
    for (const [proofAccount, _bump] of sorrtedPendingProofs) {
        const [pendingProof] = getMerklePendingProofAddress(depth, Number(proofAccount.index));
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
                proofAccount
            })
            instructions.push(instruction)
        }
    }
    return instructions
}

export type BuildDumpProofTransactionInstructionInputs = {
    signer: PublicKey;
    depth: number;
    startIndex: number;
    endIndex: number;
    merkle: PublicKey;
    pendingProof: PublicKey;
    proofAccount: MerklePendingProofState
}

export async function buildDumpProofTransactionInstruction({
                                                               signer,
                                                               depth,
                                                               startIndex,
                                                               endIndex,
                                                               merkle,
                                                               pendingProof,
                                                               proofAccount
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
        signer,
        merkle,
        pendingProof,
        anchorRemainingAccounts: remainingAccounts.map(i => toAccountMeta(i, true))
    }
    return createDumpProofInstruction(accounts)
}

export type BuildCloseMerkleTransactionInstructionInputs = {
    signer: PublicKey;
    depth: number
}

export function buildCloseMerkleTransactionInstruction({
                                                           signer,
                                                           depth
                                                       }: BuildCloseMerkleTransactionInstructionInputs): TransactionInstruction {
    const [merkle] = getMerkleAddress(depth);
    const [merkleZeros] = getMerkleZerosAddress(depth);
    const accounts: CloseMerkleInstructionAccounts = {
        signer,
        merkle,
        merkleZeros
    }
    return createCloseMerkleInstruction(accounts)
}