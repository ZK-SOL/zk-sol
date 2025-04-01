import {
    AccountMeta,
    AddressLookupTableAccount,
    BlockheightBasedTransactionConfirmationStrategy, ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    SignatureResult,
    Transaction,
    TransactionInstruction,
    TransactionMessage, VersionedTransaction
} from "@solana/web3.js";
import {Program} from "@coral-xyz/anchor";

export declare type TxnResult = {
    Signature: string;
    SignatureResult: SignatureResult;
};

export async function processTransaction(
    instructions: TransactionInstruction[],
    connection: Connection,
    payer: Keypair,
    lookupTableAccount?: AddressLookupTableAccount
): Promise<TxnResult | undefined> {
    try {
        const blockStats = await connection.getLatestBlockhash()
        if (lookupTableAccount) {
            const messageV0 = new TransactionMessage({
                payerKey: payer.publicKey,
                recentBlockhash: blockStats.blockhash,
                instructions: instructions, // note this is an array of instructions
            }).compileToV0Message([lookupTableAccount]);
            // create a v0 transaction from the v0 message
            const transactionV0 = new VersionedTransaction(messageV0);
            // sign the v0 transaction using the file system wallet we created named `payer`
            transactionV0.sign([payer]);
            // send and confirm the transaction
            // (NOTE: There is NOT an array of Signers here; see the note below...)
            const sig = await connection.sendTransaction(transactionV0);
            const strategy: BlockheightBasedTransactionConfirmationStrategy = {
                signature: sig,
                blockhash: blockStats.blockhash,
                lastValidBlockHeight: blockStats.lastValidBlockHeight
            }
            const result = await connection.confirmTransaction(strategy, 'confirmed')
            return {
                Signature: sig,
                SignatureResult: result.value
            }
        } else {
            const tx = new Transaction()
            instructions.map((i) => tx.add(i))
            tx.recentBlockhash = blockStats.blockhash
            tx.feePayer = payer.publicKey
            tx.sign(payer)
            const sig = await connection.sendRawTransaction(tx.serialize(), {
                maxRetries: 3,
                preflightCommitment: 'confirmed',
                skipPreflight: true
            })
            // console.log('Transaction signature: ', sig)
            const strategy: BlockheightBasedTransactionConfirmationStrategy = {
                signature: sig,
                blockhash: blockStats.blockhash,
                lastValidBlockHeight: blockStats.lastValidBlockHeight
            }
            const result = await connection.confirmTransaction(strategy, 'confirmed')
            return {
                Signature: sig,
                SignatureResult: result.value
            }
        }
        // }
    } catch (e) {
        console.log('processTransaction error', e)
    }
}

export async function airdrop(
    program: Program<any>,
    receiver: PublicKey,
    amount: number
) {
    const sig = await program.provider.connection.requestAirdrop(
        receiver,
        amount
    )
    const blockStats = await program.provider.connection.getLatestBlockhash()
    const strategy: BlockheightBasedTransactionConfirmationStrategy = {
        signature: sig,
        blockhash: blockStats.blockhash,
        lastValidBlockHeight: blockStats.lastValidBlockHeight
    }
    await program.provider.connection.confirmTransaction(strategy, 'confirmed')
}

export const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 3000000 // Set desired compute units (max 1,400,000)
});

export function toAccountMeta(key: PublicKey, writeable: boolean): AccountMeta {
    return {
        pubkey: key,
        isSigner: false,
        isWritable: writeable
    }
}