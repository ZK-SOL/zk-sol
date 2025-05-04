import { keypair } from './keypair';
import { close_all } from './helpers/close_all';
import { dump_proof } from './helpers/dump_proof';
import * as path from 'node:path';
import { relay, RelayInputs } from './helpers/relay';


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
		const { searchParams, pathname } = new URL(request.url);
		console.log('url', request.url);
		console.log('searchParams', searchParams);
		console.log('pathname', pathname);
		const network = searchParams.get('network') || 'devnet';
		const depth = parseInt(searchParams.get('depth') || '20');
		if (pathname === 'close_all') {
			await close_all(network);
		} else if (pathname === '/relay') {
			const body: RelayInputs = await request.json();
			console.log('body', body);
			await relay(body, network);
		} else {
			await dump_proof(network, depth);
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
