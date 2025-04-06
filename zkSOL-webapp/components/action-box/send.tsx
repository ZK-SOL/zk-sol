'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@heroui/button";
import {Input} from "@heroui/input";
import { Card } from "@heroui/card";
import { WalletGuard } from '../WalletGuard';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js';
import { CryptoHelper } from '@/solita/crypto-helpers';
import { buildWithdrawTransactionInstruction, GenerateProofPath } from '@/solita/wrappers/merkle_wrapper';
import { ZkHelper } from '@/solita/zk-helper';
import { getMerkleAccount, getMerkleAddress, getMerkleZerosAddress } from '@/solita/pda/merkle_pda';
import { getMerkleNodeAccount } from '@/solita/pda/merkle_pda';
import { run_circuit } from '@/solita/zk-helper';
import TokenDropdown from '../token-dropdown';
import axios from 'axios';
import { addToast } from '@heroui/react';
// Define token interface
interface Token {
  chainId: number;
  address: string;
  mint?: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
  balance?: number;
  price?: number;
  value?: number;
}

const Send: React.FC = () => {
  const { publicKey, sendTransaction,signTransaction }: any = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [zkProofInput, setZkProofInput] = useState<string>('');
  // Combine related state
  const [sendFormState, setSendFormState] = useState<{
    selectedToken: Token | null;
    secret: number;
    nullifer: number;
    index: number;
    amount: number;
    receiverAddress: string;
  }>({
    selectedToken: null,
    secret: 6,
    nullifer: 6,
    index: 6,
    amount: 0,
    receiverAddress: '',
  });
  const [nullifer, setNullifer] = useState<number>();
  const [secret, setSecret] = useState<number>();
  const [depth, setDepth] = useState<number>(20)
  const [merkleAddress, setMerkleAddress] = useState<PublicKey>();
  const [merkleZeros, setMerkleZeros] = useState<PublicKey>();
  const [circutName, setCircuitName] = useState<string>(`withdraw${depth}`);
  const [tokens, setTokens] = useState<Token[]>([]);

   const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 3000000 // Set desired compute units (max 1,400,000)
});

// Handle ZKProof input
const handleZkProofInput = (value: string) => {
  setZkProofInput(value);
  
  // Split the input by "-" to extract secret, nullifier, and index
  const parts = value.split('-');
  
  if (parts.length === 3) {
    const [secret, nullifer, index] = parts;
    
    // Update the form state with the parsed values
    setSendFormState(prev => ({
      ...prev,
      secret: parseInt(secret, 10) || prev.secret,
      nullifer: parseInt(nullifer, 10) || prev.nullifer,
      index: parseInt(index, 10) || prev.index
    }));
  }
};

const getTokens = async () => {
  const tokens = await axios.get('https://token.jup.ag/strict')
  return tokens.data
}

// Fetch tokens on component mount
useEffect(() => {
  const fetchTokens = async () => {
    try {
      const tokenData = await getTokens();
      setTokens(tokenData);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };
  
  fetchTokens();
}, []);
useEffect(() => {
  const [merkle] = getMerkleAddress(depth);
  const [merkleZeros] = getMerkleZerosAddress(depth)
  setMerkleAddress(merkle)
  setMerkleZeros(merkleZeros)
  setCircuitName(`withdraw${depth}`)
}, [depth])

 // Handle token selection
 const onTokenChange = (token: Token) => {
  setSendFormState(prev => ({ ...prev, selectedToken: token }));
};

async function withdraw_merkle() {
  try {
    setIsLoading(true);
    const recipient = new PublicKey(sendFormState.receiverAddress);
    let nullifer = sendFormState.nullifer;
    let secret = sendFormState.secret;
    let index = sendFormState.index;

    console.log(sendFormState)
    if (!publicKey) {
        alert("Connect wallet first")
        return
    }
    if (!nullifer) {
        alert("missing nullifer")
        return
    }
    if (!secret) {
        alert("missing secret")
        return
    }
    if (index === undefined) {
        alert("missing index")
        return
    }
    if (!recipient) {
        alert("missing recipient")
        return
    }
    if (recipient.toBase58() === publicKey.toBase58()) {
        alert("recipient and current wallet are the same")
        return
    }

    const proof_path: GenerateProofPath = CryptoHelper.generate_proof_path(depth, index);
    const merkle = await getMerkleAccount(connection, depth);
    const root = CryptoHelper.numberArrayToBigInt(
        merkle.roots[merkle.currentRootIndex]
    );
    const pathElements: bigint[] = [];
    const pathIndices: (0 | 1)[] = [];
    for (const p of proof_path) {
        if (p.length > 2) {
            const is_left = p[2] == 0 ? 0 : 1;
            const index = is_left ? p[0] : p[1];
            const node = await getMerkleNodeAccount(
                connection,
                depth,
                index
            );
            pathElements.push(CryptoHelper.numberArrayToBigInt(node.data));
            pathIndices.push(is_left);
        }
    }
    
    const nulliferR = CryptoHelper.generateAndPrepareRand(nullifer);
    const secretR = CryptoHelper.generateAndPrepareRand(secret);
    const circuit_output = await run_circuit({
        root,
        nullifier: nulliferR.num,
        secret: secretR.num,
        circuit_name: circutName,
        recipient,
        pathElements,
        pathIndices,
    });

    const proof = Array.from(
        ZkHelper.convertProofToBytes(circuit_output.proof as any)
    );
    const nullifierHash = CryptoHelper.hash(
        CryptoHelper.numberArrayToU8IntArray(nulliferR.u8Array)
    );
    const instruction = await buildWithdrawTransactionInstruction({
        connection,
        signer: publicKey,
        nullifierHash,
        root: CryptoHelper.bigIntToNumberArray(root),
        proof,
        depth,
        recipient,
    });
    const tx = new Transaction();
    tx.add(modifyComputeUnits)
    tx.add(instruction);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = publicKey;
    const txSendHash = await sendTransaction(tx, connection, {skipPreflight: true});
    setIsLoading(false);
    addToast({
      title: "Send successful",
      color: "success",
      endContent: (
        <div className="ms-11 my-2 flex gap-x-2">
          <Button color={"primary"} size="sm" variant="bordered" onPress={() => window.open(`https://solscan.io/tx/${txSendHash}?cluster=${process.env.SOLANA_NETWORK}`, '_blank')}>
            View tx 
          </Button>
        </div>
      )
    })
    console.log('withdraw_merkle', txSendHash)
  } catch (error: any) {
    console.error('Error in withdraw_merkle:', error);
    addToast({
      title: "Send failed",
      color: "danger",
      description: error.message
    })
    setIsLoading(false);
  } finally {
    setIsLoading(false);
  }
}
  return (
    <Card className="w-full mx-auto p-4 w-[450px]">
      <div className="space-y-4">
        {/* Send Amount Section */}
        <div>


          {/* Token Selection Card */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TokenDropdown 
                  tokens={tokens} 
                  selectedToken={sendFormState.selectedToken} 
                  onTokenChange={onTokenChange} 
                />
              </div>
              <Input
                value={sendFormState.amount.toString()}
                onChange={(e) => setSendFormState(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                placeholder="0.00"
                style={{ textAlign: 'right' }}
                className="w-full/2 bg-transparent text-right border-none focus:ring-0 text-lg font-medium"
              />
    
            </div>
          </Card>
        </div>

        {/* ZKProof Section */}
        <div>
          <span className="text-sm text-gray-600 mb-2 block">ZKProof (format: secret-nullifier-index)</span>
          <Input 
            placeholder="Paste your ZKProof here"
            className="w-full"
            value={zkProofInput}
            onChange={(e) => handleZkProofInput(e.target.value)}
          />
          {zkProofInput && zkProofInput.split('-').length !== 3 && (
            <p className="text-xs text-red-500 mt-1">Invalid format. Please use the format: secret-nullifier-index</p>
          )}
        </div>

        {/* Receiver Section */}
        <div>
          <span className="text-sm text-gray-600 mb-2 block">Receiver</span>
          <Input 
            placeholder="receiver address"
            className="w-full"
            value={sendFormState.receiverAddress}
            onChange={(e) => setSendFormState(prev => ({ ...prev, receiverAddress: e.target.value }))}
          />
        </div>

        {/* Memo Section */}
        {/* <div>
          <span className="text-sm text-gray-600 mb-2 block">Memo</span>
          <Input 
            placeholder="Enter a memo"
            className="w-full"
            value={sendState.memo}
            onChange={(e) => setSendState(prev => ({ ...prev, memo: e.target.value }))}
          />
        </div> */}

        {/* Send Button */}
        <WalletGuard>
        <Button 
          onPress={() => withdraw_merkle()}
          color='primary'
          className="w-full text-white"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </Button>
        </WalletGuard>
      </div>
    </Card>
  );
};

export default Send;
