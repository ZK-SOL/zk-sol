
import {
    AccountMeta,
    AddressLookupTableAccount,
    BlockheightBasedTransactionConfirmationStrategy, ComputeBudgetProgram,
    Connection,
    Keypair, ParsedTransactionWithMeta, PublicKey,
    SignatureResult,
    Transaction,
    TransactionInstruction,
    TransactionMessage, VersionedTransaction
} from "@solana/web3.js";
import assert from "assert";
import {Program} from "@coral-xyz/anchor";
import {createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, NATIVE_MINT} from "@solana/spl-token";


export async function processAndValidateTransaction(
    instructions: TransactionInstruction[],
    connection: Connection,
    signer: Keypair
) {
    const sig = await processTransaction(instructions, connection, signer)
    if (sig) {
        const txn = await connection.getParsedTransaction(sig.Signature, 'confirmed')
        return txn
    } else {
        return null
    }
}

export declare type TxnResult = {
    Signature: string;
    SignatureResult: SignatureResult;
};

export async function processTransaction(
	instructions: TransactionInstruction[],
	connection: Connection,
	payer: Keypair,
	lookupTableAccount?: AddressLookupTableAccount,
	confirm?: boolean
): Promise<TxnResult | undefined> {
	try {
		const blockStats = await connection.getLatestBlockhash();
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
				lastValidBlockHeight: blockStats.lastValidBlockHeight,
			};
			if (confirm) {
				const result = await connection.confirmTransaction(strategy, 'confirmed');
				return {
					Signature: sig,
					SignatureResult: result.value,
				};
			} else {
				return {
					Signature: sig,
					SignatureResult: { err: null },
				};
			}
		} else {
			const tx = new Transaction();
			instructions.map((i) => tx.add(i));
			tx.recentBlockhash = blockStats.blockhash;
			tx.feePayer = payer.publicKey;
			tx.sign(payer);
			const sig = await connection.sendRawTransaction(tx.serialize(), {
				maxRetries: 3,
				preflightCommitment: 'confirmed',
				skipPreflight: true,
			});
			// console.log('Transaction signature: ', sig)
			const strategy: BlockheightBasedTransactionConfirmationStrategy = {
				signature: sig,
				blockhash: blockStats.blockhash,
				lastValidBlockHeight: blockStats.lastValidBlockHeight,
			};
			if (confirm) {
				const result = await connection.confirmTransaction(strategy, 'confirmed');
				return {
					Signature: sig,
					SignatureResult: result.value,
				};
			} else {
				return {
					Signature: sig,
					SignatureResult: { err: null },
				};
			}
		}
		// }
	} catch (e) {
		console.log('processTransaction error', e);
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

export async function getTxn(
    program: Program<any>,
    signature: string
): Promise<ParsedTransactionWithMeta | null> {
    const blockStats = await program.provider.connection.getLatestBlockhash()
    const strategy: BlockheightBasedTransactionConfirmationStrategy = {
        signature: signature,
        blockhash: blockStats.blockhash,
        lastValidBlockHeight: blockStats.lastValidBlockHeight
    }
    await program.provider.connection.confirmTransaction(strategy, 'confirmed')
    return await program.provider.connection.getParsedTransaction(
        signature,
        'confirmed'
    )
}



export async function getOrCreateTokenAccountInstruction(
    mint: PublicKey,
    user: PublicKey,
    connection: Connection,
    payer: PublicKey | null = null
): Promise<TransactionInstruction | null> {
    const userTokenAccountAddress = await getAssociatedTokenAddress(
        mint,
        user,
        false
    )
    const userTokenAccount = await connection.getParsedAccountInfo(
        userTokenAccountAddress
    )
    if (userTokenAccount.value === null) {
        return createAssociatedTokenAccountInstruction(
            payer ? payer : user,
            userTokenAccountAddress,
            user,
            mint
        )
    } else {
        return null
    }
}


export async function accountExists(
    connection: Connection,
    pubkey: PublicKey
): Promise<boolean> {
    const account_info = await connection.getAccountInfo(pubkey, 'confirmed')
    return account_info !== null
}

export async function getTokenAccountBalance(
    connection: Connection,
    account: PublicKey
): Promise<number> {
    const account_info = await connection.getAccountInfo(account)
    if (account_info === null) {
        return 0
    }
    const tokenBalance = await connection.getTokenAccountBalance(
        account,
        'confirmed'
    )
    return parseInt(tokenBalance.value.amount)
}

export async function getWalletBalance(
    connection: Connection,
    wallet: PublicKey,
    mint: PublicKey
): Promise<number> {
    const balance = await connection.getBalance(wallet)
    if (mint.toBase58() === NATIVE_MINT.toBase58()) {
        return balance
    } else {
        const tokenAccount = await getAssociatedTokenAddress(mint, wallet)
        const tokenBalance = await connection.getTokenAccountBalance(
            tokenAccount,
            'confirmed'
        )
        return parseInt(tokenBalance.value.amount)
    }
}

export const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 3000000 // Set desired compute units (max 1,400,000)
});


export type CreateLookupTableInput = {
    signer: PublicKey;
    connection: Connection
    addresses: PublicKey[];
}
export type CreateLookupTableOutput = {
    lookupTableAddress: PublicKey;
    instructions: TransactionInstruction[];
}

export function toAccountMeta(key: PublicKey, writeable: boolean): AccountMeta {
    return {
        pubkey: key,
        isSigner: false,
        isWritable: writeable
    }
}