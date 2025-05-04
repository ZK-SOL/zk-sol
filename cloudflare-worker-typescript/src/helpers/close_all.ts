import { Connection, Transaction } from '@solana/web3.js';
import { PROGRAM_ID } from '../solita';
import { buildClosePdaAccountTransactionInstruction } from '../solita/wrappers/merkle_wrapper';
import { keypair } from '../keypair';
import { modifyComputeUnits } from '../solita/sol-helpers';
import { DEVNET, MAINNET } from './constants';

export async function close_all(network: string) {
	console.log('running close all');
	console.log('starting run: network', network);
	const connection = new Connection(network === 'devnet' ? DEVNET : MAINNET);
	const accounts = await connection.getProgramAccounts(PROGRAM_ID);
	console.log('accounts.length', accounts.length);
	const transactions: Transaction[] = [];
	let counter = 0;
	for (const account of accounts.values()) {
		const close_pda_account = buildClosePdaAccountTransactionInstruction({
			signer: keypair.publicKey,
			account: account.pubkey,
		});
		const tx = new Transaction();
		tx.add(modifyComputeUnits);
		tx.add(close_pda_account);
		const block = await connection.getLatestBlockhash();
		tx.recentBlockhash = block.blockhash;
		tx.lastValidBlockHeight = block.lastValidBlockHeight;
		tx.feePayer = keypair.publicKey;
		tx.sign(keypair);
		transactions.push(tx);
		counter += 1;
		console.log('counter = ', counter);
	}
	for (const tx of transactions) {
		const txDespoitHash = await connection.sendRawTransaction(tx.serialize(), {
			skipPreflight: true,
			preflightCommitment: 'confirmed',
		});
		console.log('clear_pda', txDespoitHash);
	}
}
