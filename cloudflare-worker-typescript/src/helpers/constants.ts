import { NATIVE_MINT } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export const DEVNET = 'https://devnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c';
export const MAINNET = 'https://mainnet.helius-rpc.com/?api-key=32c35600-ee87-4ba1-b348-7d41f9b1693c';
export const MINTS = [new PublicKey('4otg1HCdA1NozTX6Teh9qQzSsSeTnwSCLaFvSH4hbuCz'), NATIVE_MINT];
