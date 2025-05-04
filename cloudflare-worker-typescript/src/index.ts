import { keypair } from './keypair';
import { close_all } from './helpers/close_all';
import { dump_proof } from './helpers/dump_proof';
import * as path from 'node:path';
import { relay, RelayInputs } from './helpers/relay';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*', // Allow all origins (or specify a specific origin)
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allowed methods
	'Access-Control-Allow-Headers': 'Content-Type' // Allowed headers
};


export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					...corsHeaders,
					'Access-Control-Max-Age': '86400' // Cache preflight response for 24 hours
				},
				status: 204
			});
		}
		const { searchParams, pathname } = new URL(request.url);
		console.log('url', request.url);
		console.log('searchParams', searchParams);
		console.log('pathname', pathname);
		const network = searchParams.get('network') || 'devnet';
		const depth = parseInt(searchParams.get('depth') || '20');
		if (pathname === 'close_all') {
			await close_all(network);
			return new Response(`Close All done with Key: ${keypair.publicKey.toBase58()}`,
				{
					headers: {
						...corsHeaders
					}
				});
		} else if (pathname === '/relay') {
			const body: RelayInputs = await request.json();
			console.log('body', body);
			const txnId = await relay(body, network);
			if (txnId) {
				return new Response(txnId, {
					status: 200,
					headers: {
						...corsHeaders
					}
				});
			} else {
				return new Response('Something went wrong', {
					status: 200, headers: {
						...corsHeaders
					}
				});
			}
		} else {
			await dump_proof(network, depth);
			return new Response(`Dump done with Key: ${keypair.publicKey.toBase58()}`, {
				status: 200, headers: {
					...corsHeaders
				}
			});
		}
	},


	// Cron job handler
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	) {
		console.log('cron processed');
		for (const network of ['devnet', 'mainnet']) {
			for (const depth of [20, 10, 5]) {
				try {
					await dump_proof(network, depth);
				} catch (error: any) {
					console.log('cron error network ', network, ' | depth = ', depth, ' | error = ', error);
				}
			}
		}
	}
} satisfies ExportedHandler<Env>;
