import { Connection } from '@solana/web3.js';
import { buildDumpProofTransactionInstructionsArray } from '../solita/wrappers/merkle_wrapper';
import { keypair } from '../keypair';
import { modifyComputeUnits, processTransaction } from '../solita/sol-helpers';
import { DEVNET, MAINNET, MINTS } from './constants';

export async function dump_proof(network: string, depth: number) {
	console.log('running dump proof');
	console.log('starting run: network', network, ' | depth:', depth);
	const connection = new Connection(network === 'devnet' ? DEVNET : MAINNET);
	for (const mint of MINTS) {
		console.log('running on mint:', mint.toBase58());
		const instructions = await buildDumpProofTransactionInstructionsArray({
			signer: keypair.publicKey,
			connection: connection,
			depth,
			mint,
		});
		console.log('instructions.length:', instructions.length);
		for (const instruction of instructions) {
			try {
				const sig = await processTransaction([modifyComputeUnits, instruction], connection, keypair);
				console.log('sig:', sig);
				if (sig) {
					const txn = await connection.getParsedTransaction(sig.Signature, {
						commitment: 'confirmed',
						maxSupportedTransactionVersion: 0,
					});
					if (txn) {
						console.log('txn:', txn.transaction.message);
					}
				}
			} catch (error: any) {
				console.error('run error: mint', mint.toBase58(), ' error : ', error);
			}
		}
	}
}
