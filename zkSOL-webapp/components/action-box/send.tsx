"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { WalletGuard } from "../WalletGuard";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { CryptoHelper } from "@/solita/crypto-helpers";
import {
  buildWithdrawTransactionInstruction,
  GenerateProofPath,
} from "@/solita/wrappers/merkle_wrapper";
import { ZkHelper } from "@/solita/zk-helper";
import {
  getMerkleAccount,
  getMerkleAddress,
  getMerkleZerosAddress,
} from "@/solita/pda/merkle_pda";
import { getMerkleNodeAccount } from "@/solita/pda/merkle_pda";
import { run_circuit } from "@/solita/zk-helper";
import TokenDropdown from "../token-dropdown";
import axios from "axios";
import { addToast, Image, Tooltip } from "@heroui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Icon } from "@iconify/react";

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

// Helper function to create SOL token
const createSolToken = (balance: number): Token => ({
  chainId: 101,
  address: NATIVE_MINT.toString(),
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  tags: ["native"],
  balance: balance / LAMPORTS_PER_SOL,
  price: 0,
  value: 0,
});

const Send: React.FC = () => {
  const { publicKey, sendTransaction, signTransaction }: any = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [zkProofInput, setZkProofInput] = useState<string>("");
  // Combine related state
  const [sendFormState, setSendFormState] = useState<{
    selectedToken: Token | null;
    secret: number | null;
    nullifier: number | null;
    index: number | null;
    amount: number;
    receiverAddress: string;
  }>({
    selectedToken: null,
    secret: null,
    nullifier: null,
    index: null,
    amount: 1,
    receiverAddress: "",
  });
  const [depth, setDepth] = useState<number>(20);
  const [merkleAddress, setMerkleAddress] = useState<PublicKey>();
  const [merkleZeros, setMerkleZeros] = useState<PublicKey>();
  const [circutName, setCircuitName] = useState<string>(`withdraw${depth}`);
  const [tokens, setTokens] = useState<Token[]>([
    {
      chainId: 101,
      address: NATIVE_MINT.toString(),
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      balance: 0,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },

  ]);

  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 3000000, // Set desired compute units (max 1,400,000)
  });

  // Handle ZKProof input
  const handleZkProofInput = (value: string) => {
    setZkProofInput(value);
    console.log("value", value);
    // Split the input by "-" to extract secret, nullifier, and index
    const parts = value.split("-");

    if (parts.length === 3) {
      // Correct order: secret-nullifier-index
      const [index, nullifier, secret] = parts;

      // Update the form state with the parsed values
      setSendFormState((prev: any) => {
        const newState = {
          ...prev,
          secret: Number(secret),
          nullifier: Number(nullifier),
          index: Number(index),
        };
        // Log the new state inside the callback to see the updated values
        return newState;
      });
    }
  };

  const setBalance = async () => {
    if (!publicKey) {
      return;
    }
    const solBalance = await connection.getBalance(publicKey);
    const solToken = createSolToken(solBalance);
    setTokens([solToken]);
    setSendFormState((prev) => ({ ...prev, selectedToken: solToken }));
  }
  useEffect(() => {
    setBalance();
    if (!sendFormState.selectedToken) {
      return;
    }

    try {
      console.log("sendFormState", sendFormState);
      const [merkle] = getMerkleAddress(
        depth,
        new PublicKey(sendFormState.selectedToken.address),
      );
      const [merkleZeros] = getMerkleZerosAddress(
        depth,
        new PublicKey(sendFormState.selectedToken.address),
      );
      setMerkleAddress(merkle);
      setMerkleZeros(merkleZeros);
      setCircuitName(`withdraw${depth}`);
      console.log("my merkle", merkle.toBase58(), merkleZeros.toBase58());
    } catch (error) {
      console.error("Error in useEffect:", error);
    }
  }, [depth, sendFormState.selectedToken?.address]);

  // Handle token selection
  const onTokenChange = (token: Token) => {
    setSendFormState((prev) => ({ ...prev, selectedToken: token }));
  };

  async function withdraw_merkle() {
    try {
      setIsLoading(true);
      const recipient = new PublicKey(sendFormState.receiverAddress);
      let nullifier = sendFormState.nullifier;
      let secret = sendFormState.secret;
      let index = sendFormState.index;
      if (!publicKey) {
        alert("Connect wallet first");
        return;
      }
      if (!nullifier) {
        alert("missing nullifier");
        return;
      }
      if (!secret) {
        alert("missing secret");
        return;
      }
      if (!index) {
        alert("missing index");
        return;
      }
      if (!recipient) {
        alert("missing recipient");
        return;
      }
      if (recipient.toBase58() === publicKey.toBase58()) {
        alert("recipient and current wallet are the same");
        return;
      }
      if (!sendFormState.selectedToken) {
        alert("missing token");
        return;
      }

      const proof_path: GenerateProofPath = CryptoHelper.generate_proof_path(
        depth,
        index,
      );
      const merkle = await getMerkleAccount(
        connection,
        depth,
        new PublicKey(sendFormState.selectedToken.address),
      );
      const root = CryptoHelper.numberArrayToBigInt(
        merkle.roots[merkle.currentRootIndex],
      );
      const pathElements: bigint[] = [];
      const pathIndices: (0 | 1)[] = [];
      for (const p of proof_path) {
        if (p.length > 2) {
          const is_left = p[2] == 0 ? 0 : 1;
          const index = is_left ? p[0] : p[1];
          const node = await getMerkleNodeAccount(connection, depth, index);
          pathElements.push(CryptoHelper.numberArrayToBigInt(node.data));
          pathIndices.push(is_left);
        }
      }

      const nullifierR = CryptoHelper.generateAndPrepareRand(nullifier);
      const secretR = CryptoHelper.generateAndPrepareRand(secret);
      const circuit_output = await run_circuit({
        root,
        nullifier: nullifierR.num,
        secret: secretR.num,
        circuit_name: circutName,
        recipient,
        pathElements,
        pathIndices,
      });

      const proof = Array.from(
        ZkHelper.convertProofToBytes(circuit_output.proof as any),
      );
      const nullifierHash = CryptoHelper.hash(
        CryptoHelper.numberArrayToU8IntArray(nullifierR.u8Array),
      );

      /*
      send to relay here
       */
      const relayUrl = `${process.env.NEXT_PUBLIC_RELAY_URL}/api/relay`;
      console.log("relayUrl", relayUrl);
      const body: {
        nullifierHash: number[];
        proof: number[];
        root: number[];
        recipient: string;
        depth: number;
        mint: string;
      } = {
        nullifierHash,
        proof,
        depth,
        mint: sendFormState.selectedToken.address,
        recipient: recipient.toBase58(),
        root: CryptoHelper.bigIntToNumberArray(root),
      };

      const relayResponse = await fetch(relayUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const txSendHash =
        relayResponse.status === 200 ? (await relayResponse.json()).signature : null;
      if (txSendHash === null) {
        throw new Error("error in relay");
      }
      // const instruction = await buildWithdrawTransactionInstruction({
      //   connection,
      //   signer: publicKey,
      //   nullifierHash,
      //   root: CryptoHelper.bigIntToNumberArray(root),
      //   proof,
      //   depth,
      //   recipient,
      //   mint: new PublicKey(sendFormState.selectedToken.address),
      // });
      // const tx = new Transaction();
      // tx.add(modifyComputeUnits);
      // tx.add(instruction);
      // tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      // tx.feePayer = publicKey;
      // const txSendHash = await sendTransaction(tx, connection, {
      //   skipPreflight: true,
      // });
      setIsLoading(false);
      addToast({
        title: "Send successful",
        color: "success",
        endContent: (
          <div className="ms-11 my-2 flex gap-x-2">
            <Button
              color={"primary"}
              size="sm"
              variant="bordered"
              onPress={() =>
                window.open(
                  `https://explorer.solana.com/tx/${txSendHash}?cluster=${process.env.SOLANA_NETWORK}`,
                  "_blank",
                )
              }
            >
              View tx
            </Button>
          </div>
        ),
      });
    } catch (error: any) {
      console.error("Error in withdraw_merkle:", error);
      addToast({
        title: "Send failed",
        color: "danger",
        description: error.message,
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
     

        {/* Send Amount Section */}
        
          <Card className="w-full  mx-auto py-4 px-4 shadow-none border-none w-[450px] bg-primary/15  rounded-xl">
            <div className="">
              {/* Token Row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  
                    <Image
                      src={tokens[0].logoURI}
                      alt={tokens[0].symbol}
                      width={32}
                      height={32}
                      className="rounded-full border border-gray-700"
                    />
                  
                  <span className="font-bold  text-base">
                    {tokens[0].symbol}
                  </span>
                </div>
                <span className="text-gray-400 text-lg font-medium">
                  <div className="flex gap-2">
                    <Button
                      variant="flat"
                      size="sm"
                      className="rounded-full py-1 text-xs text-primary-400 bg-white dark:bg-gray-800 border border-primary-400"

                    >
                      1
                    </Button>
                    <Button
                      variant="flat"
                      size="sm"
                      className="rounded-full px-3 py-1 text-xs text-gray-400 bg-white dark:bg-gray-800 cursor-not-allowed opacity-50"
                      disabled
                    >
                      5 <span className="text-primary">soon</span>
                    </Button>
                  </div>
                </span>
              </div>




            </div>
          </Card>
    
     

        {/* ZKProof Section */}
        <div>
          <span className="text-sm text-gray-600 mb-2 flex items-center gap-2">
            ZKProof <Tooltip content="Format: secret-nullifier-index">
              <Icon icon="mdi:help-circle-outline" className="w-4 h-4" />
            </Tooltip>
          </span>
          <Input
            variant="flat"
            color="primary"
            placeholder="Paste your ZKProof here"
            className="w-full "
            value={zkProofInput}
            onChange={(e) => handleZkProofInput(e.target.value)}
          />
          {zkProofInput && zkProofInput.split("-").length !== 3 && (
            <p className="text-xs text-red-500 mt-1">
              Invalid format. Please use the format: secret-nullifier-index
            </p>
          )}
        </div>

        {/* Receiver Section */}
        <div>
          <span className="text-sm text-gray-600 mb-2 block">Receiver</span>
          <Input
            variant="flat"
            color="primary"
            placeholder="receiver address"
            className="w-full"
            value={sendFormState.receiverAddress}
            onChange={(e) =>
              setSendFormState((prev) => ({
                ...prev,
                receiverAddress: e.target.value,
              }))
            }
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
            color="primary"
            className="w-full text-white"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Send"}
          </Button>
        </WalletGuard>

     
    </div>
  );
};

export default Send;
