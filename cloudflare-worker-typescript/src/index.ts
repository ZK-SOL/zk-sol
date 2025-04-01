import {Connection} from "@solana/web3.js";
import {keypair} from "./keypair";
import {buildDumpProofTransactionInstructionsArray} from "./solita/wrappers/merkle_wrapper";
import {modifyComputeUnits, processTransaction} from "./solita/sol-helpers";

const DEVNET = "https://devnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"
const MAINNET = "https://mainnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"

async function run(network: string, depth: number) {
    const connection = new Connection(network === "devnet" ? DEVNET : MAINNET);
    const signer = keypair;
    const instructions = await buildDumpProofTransactionInstructionsArray({
        signer: keypair.publicKey,
        connection: connection,
        depth
    })
    console.log("instructions.length = ", instructions.length)
    for (const instruction of instructions) {
        const sig = await processTransaction(
            [modifyComputeUnits, instruction],
            connection,
            signer,
        )
        if (sig) {
            const txn = await connection.getParsedTransaction(
                sig.Signature,
                {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0
                }
            )
        }
    }
}

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
        const {searchParams} = new URL(request.url)
        const network = searchParams.get("network") || "devnet";
        const depth = parseInt(searchParams.get("depth") || "20");
        await run(network, depth);
        return new Response(`Great success: ${keypair.publicKey.toBase58()}`);
    },


    // Cron job handler
    async scheduled(
        controller: ScheduledController,
        env: Env,
        ctx: ExecutionContext,
    ) {
        console.log("cron processed");
        for (const network of ["devnet", "mainnet"]) {
            for (const depth of [20, 10, 5]) {
                try {
                    await run(network, depth);
                } catch (error: any) {
                    console.log("cron error network ", network, " | depth = ", depth, " | error = ", error)
                }
            }
        }
    },
} satisfies ExportedHandler<Env>;
