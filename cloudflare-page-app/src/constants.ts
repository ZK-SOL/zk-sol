import {PublicKey} from '@solana/web3.js'
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base'


// const DEVNET = "https://devnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"
const DEVNET = "https://api.devnet.solana.com"
const MAINNET = "https://mainnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c"


export const mint = new PublicKey(import.meta.env.VITE_MINT)

export const network = WalletAdapterNetwork.Devnet
// export const rpc = import.meta.env.VITE_RPC
export const rpc = DEVNET;

console.log('rpc', rpc, ' mint', mint.toBase58())
