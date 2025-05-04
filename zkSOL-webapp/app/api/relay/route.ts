import { processTransaction } from "@/solita/sol-helpers";
import { buildWithdrawTransactionInstruction } from "@/solita/wrappers/merkle_wrapper";
import { Connection } from "@solana/web3.js";

import { PublicKey } from "@solana/web3.js";
import { keypair } from "../keypair";
import { modifyComputeUnits } from "@/solita/sol-helpers";
import { NextRequest, NextResponse } from "next/server";
 const DEVNET = 'https://devnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c';
 const MAINNET = 'https://mainnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c';
 type RelayInputs = {
	nullifierHash: number[];
	proof: number[];
	root: number[];
	recipient: string;
	depth: number;
	mint: string;
};

async function relay(input_params: RelayInputs, network: string): Promise<string | undefined> {
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
		const sig = await processTransaction([modifyComputeUnits, instruction], connection, keypair, undefined, false);
		// await connection.getParsedTransaction(sig.Signature, 'confirmed');
		return sig?.Signature;
	} catch (error: any) {
		console.error('relay error:', error);
	}
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const input_params: RelayInputs = await request.json();
		const network = process.env.SOLANA_NETWORK || 'devnet';
		const sig = await relay(input_params, network);
		return NextResponse.json({ signature: sig });
	} catch (error: any) {
		console.error('Relay error:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to process relay request' },
			{ status: 500 }
		);
	}
}