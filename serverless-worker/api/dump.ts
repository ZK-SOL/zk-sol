import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {keypair} from "../keypair";
import {
    buildClosePdaAccountTransactionInstruction,
    buildDumpProofTransactionInstructionsArray
} from "../solita/wrappers/merkle_wrapper";
import {modifyComputeUnits, processTransaction} from "../solita/sol-helpers";
import {NATIVE_MINT} from "@solana/spl-token";
import {PROGRAM_ID} from "../solita";

const DEVNET = "https://devnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"
const MAINNET = "https://mainnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"
const MINTS = [
    new PublicKey("4otg1HCdA1NozTX6Teh9qQzSsSeTnwSCLaFvSH4hbuCz"),
    NATIVE_MINT
]

async function close_all(network: string) {
    console.log("starting run: network", network);
    try {
        const connection = new Connection(network === "devnet" ? DEVNET : MAINNET);
        const accounts = await connection.getProgramAccounts(PROGRAM_ID)
        console.log("accounts.length", accounts.length)
        const transactions: Transaction[] = [];
        let counter = 0;
        for (const account of accounts.values()) {
            try {
                const close_pda_account = buildClosePdaAccountTransactionInstruction({
                    signer: keypair.publicKey,
                    account: account.pubkey
                })
                const tx = new Transaction();
                tx.add(modifyComputeUnits)
                tx.add(close_pda_account);
                const block = await connection.getLatestBlockhash();
                tx.recentBlockhash = block.blockhash;
                tx.lastValidBlockHeight = block.lastValidBlockHeight;
                tx.feePayer = keypair.publicKey;
                tx.sign(keypair);
                transactions.push(tx);
                counter += 1;
                console.log("counter = ", counter)
            } catch (error: any) {
                console.error("Error creating transaction for account:", account.pubkey.toBase58(), "error:", error.message)
            }
        }
        for (const tx of transactions) {
            try {
                const txDespoitHash = await connection.sendRawTransaction(
                    tx.serialize()
                    , {
                        skipPreflight: true,
                        preflightCommitment: "confirmed"
                    });
                console.log('clear_pda', txDespoitHash)
            } catch (error: any) {
                console.error("Error sending transaction:", error.message)
            }
        }
    } catch (error: any) {
        console.error("Error in close_all function:", error.message)
        console.error("Error details:", error)
        throw error; // Re-throw to be caught by the handler
    }
}

async function run(network: string, depth: number) {
    console.log("starting run: network", network, " | depth:", depth);
    const connection = new Connection(network === "devnet" ? DEVNET : MAINNET);
    for (const mint of MINTS) {
        console.log("running on mint:", mint.toBase58())
        try {
            const instructions = await buildDumpProofTransactionInstructionsArray({
                signer: keypair.publicKey,
                connection: connection,
                depth,
                mint
            })
            console.log("instructions.length:", instructions.length)
            for (const instruction of instructions) {
                try {
                    const sig = await processTransaction(
                        [modifyComputeUnits, instruction],
                        connection,
                        keypair,
                    )
                    if (sig) {
                        const txn = await connection.getParsedTransaction(
                            sig.Signature,
                            {
                                commitment: 'confirmed',
                                maxSupportedTransactionVersion: 0
                            }
                        )
                        if (txn) {
                            console.log("txn:", txn.transaction.message)
                        }
                    }
                } catch (error: any) {
                    console.error("Error processing transaction: mint", mint.toBase58(), " error:", error.message)
                    console.error("Error details:", error)
                }
            }
        } catch (error: any) {
            console.error("Error building instructions: mint", mint.toBase58(), " error:", error.message)
            console.error("Error details:", error)
        }
    }
}

/**
 * Vercel Serverless Function handler
 * 
 * @param req - The request object from Vercel
 * @param res - The response object from Vercel
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    console.log("url", req.url);
    console.log("searchParams", searchParams);
    
    const closeAll = searchParams.get("closeAll") || false;
    const network = searchParams.get("network") || "devnet";
    const depth = parseInt(searchParams.get("depth") || "20");
    
    if (closeAll === "true") {
      console.log("running close all");
      await close_all(network);
      return res.status(200).json({ 
        success: true, 
        message: `Closed all accounts on ${network}` 
      });
    } else {
      // Regular request
      await run(network, depth);
      return res.status(200).json({ 
        success: true, 
        message: `Processed dump for network ${network} with depth ${depth}`,
        keypair: keypair.publicKey.toBase58()
      });
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    // Provide more detailed error information
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: error.toString()
    });
  }
}
