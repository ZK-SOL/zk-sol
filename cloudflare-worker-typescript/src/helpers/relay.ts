import { buildWithdrawTransactionInstruction } from '../solita/wrappers/merkle_wrapper';
import { Connection, PublicKey } from '@solana/web3.js';
import { DEVNET, MAINNET } from './constants';
import { keypair } from '../keypair';
import { modifyComputeUnits, processTransaction } from '../solita/sol-helpers';

export type RelayInputs = {
	nullifierHash: number[];
	proof: number[];
	root: number[];
	recipient: string;
	depth: number;
	mint: string;
};

export async function relay(input_params: RelayInputs, network: string) {
	console.log('running relay');
	try {
		console.log('starting run: network', network);
		const connection = new Connection(network === 'devnet' ? DEVNET : MAINNET);
		const instruction = await buildWithdrawTransactionInstruction({
			mint: new PublicKey(input_params.mint),
			connection: connection,
			signer: keypair.publicKey,
			nullifierHash: input_params.nullifierHash,
			root: input_params.root,
			proof: input_params.proof,
			depth: input_params.depth,
			recipient: new PublicKey(input_params.recipient),
		});
		const sig = await processTransaction([modifyComputeUnits, instruction], connection, keypair);
		await connection.getParsedTransaction(sig.Signature, 'confirmed');
	} catch (error: any) {
		console.error('relay error:', error);
	}
}
