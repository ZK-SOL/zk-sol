"use client";
import { Buffer } from "buffer";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Input } from "@heroui/input";
import { Image } from "@heroui/image";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletGuard } from "@/components/WalletGuard";
import { modifyComputeUnits } from "@/solita/sol-helpers";
import {
  buildCreateMerkleTransactionInstruction,
  buildDepositTransactionInstruction,
  buildWithdrawTransactionInstruction,
  GenerateProofPath,
} from "@/solita/wrappers/merkle_wrapper";
import { CryptoHelper } from "@/solita/crypto-helpers";
import { run_circuit } from "@/solita/zk-helper";
import { ZkHelper } from "@/solita/zk-helper";
import { getMerkleNodeAccount } from "@/solita/pda/merkle_pda";
import { getMerkleAccount } from "@/solita/pda/merkle_pda";
import { NATIVE_MINT } from "@solana/spl-token";
import axios from "axios";
import TokenDropdown, { Token } from "@/components/token-dropdown";
import { color } from "framer-motion";
import { addToast, Divider } from "@heroui/react";
import { DepositStateType } from "@/types/deposit";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Icon } from "@iconify/react";

export const ChevronDownIcon = () => {
  return (
    <svg
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.9188 8.17969H11.6888H6.07877C5.11877 8.17969 4.63877 9.33969 5.31877 10.0197L10.4988 15.1997C11.3288 16.0297 12.6788 16.0297 13.5088 15.1997L15.4788 13.2297L18.6888 10.0197C19.3588 9.33969 18.8788 8.17969 17.9188 8.17969Z"
        fill="currentColor"
      />
    </svg>
  );
};

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

interface DepositProps {
  depositState?: DepositStateType;
  setDepositState?: (state: DepositStateType) => void;
}

const Deposit: React.FC<DepositProps> = ({ depositState: parentDepositState, setDepositState: setParentDepositState }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<"deposit" | "processing..." | "generating proof">("deposit");
  const {
    connected,
    publicKey,
    disconnect,
    signTransaction,
    sendTransaction,
  } = useWallet();
  const { connection } = useConnection();
  const [showProof, setShowProof] = useState(false);
  const [proofData, setProofData] = useState<{
    index: number;
    secret: number;
    nullifier: number;
  } | null>(null);

  // Combine related state
  const [depositFormState, setDepositFormState] = useState<{
    selectedToken: Token | null;
    secret: number | null;
    nullifier: number | null;
    amount: number;
  }>({
    selectedToken: null,
    secret: null,
    nullifier: null,
    amount: 1,
  });

  // Token state
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

  const [depth, setDepth] = useState<number>(20);


  // Add refs to store random values
  const randomValuesRef = useRef<{
    secret: number | null;
    nullifier: number | null;
  }>({
    secret: null,
    nullifier: null
  });

  // Initialize local state from parent state if available
  useEffect(() => {
    if (parentDepositState) {
      setDepositFormState(prev => ({
        ...prev,
        secret: parentDepositState.secret || null,
        nullifier: parentDepositState.nullifier || null,
        amount: parentDepositState.amount || 1,
      }));
      setShowProof(parentDepositState.showProof || false);
      if (parentDepositState.proofData) {
        setProofData(parentDepositState.proofData);
      }
    }

  }, [parentDepositState, publicKey]);

  // Update parent state when local state changes
  useEffect(() => {
    if (setParentDepositState) {
      // Only update parent state if we have valid values
      if (depositFormState.secret && depositFormState.nullifier) {
        setParentDepositState({
          secret: depositFormState.secret,
          nullifier: depositFormState.nullifier,
          amount: depositFormState.amount,
          showProof,
          proofData: proofData || undefined,
        });
      }
    }
  }, [depositFormState, showProof, proofData, setParentDepositState]);

  const getMerkleAccount1 = async () => {
    if (!depositFormState.selectedToken?.address) {
      alert("No token selected");
      return;
    }
    const merkle = await getMerkleAccount(connection, depth, new PublicKey(depositFormState.selectedToken.address));
    return Number(merkle.nextIndex) - 1
  }
  // Fetch tokens from API
  const fetchTokens = useCallback(async () => {
    if (!publicKey) {
      console.log("No public key available for fetching tokens");
      return;
    }

    try {
      // Fallback to SOL only
      const solBalance = await connection.getBalance(publicKey);
      const solToken = createSolToken(solBalance);

      setTokens([solToken]);
      setDepositFormState((prev) => ({ ...prev, selectedToken: solToken }));

      // Set selected token if not already set
      if (!depositFormState.selectedToken) {
        const tokenToSelect = tokens[0];
        console.log("Setting selected token:", tokenToSelect);
        setDepositFormState((prev) => ({
          ...prev,
          selectedToken: tokenToSelect,
        }));
      }

    } catch (error) {
      console.error("Error fetching tokens:", error);

      // Fallback to SOL only
      const solBalance = await connection.getBalance(publicKey);
      const solToken = createSolToken(solBalance);
      console.log("API failed, setting only SOL token:", solToken);
      setTokens([solToken]);
      setDepositFormState((prev) => ({ ...prev, selectedToken: solToken }));
    }
  }, [publicKey, connection]);

  // Initialize tokens when wallet connects
  useEffect(() => {
    const initializeTokens = async () => {
      if (connected && publicKey) {
        console.log("Wallet connected, initializing tokens");
        const balance = await connection.getBalance(publicKey);
        console.log("Balance:", balance);
        const solToken = createSolToken(balance);
        console.log("Setting initial SOL token:", solToken);
        setTokens([solToken]);
        setDepositFormState((prev) => ({ ...prev, selectedToken: solToken }));
        fetchTokens();
      } else {
        console.log("Wallet not connected or no public key");
      }
    };

    initializeTokens();
  }, [connected, publicKey, fetchTokens]);

  // Handle token selection
  const onTokenChange = (token: Token) => {
    console.log("Token selected:", token);
    setDepositFormState((prev) => {
      const newState = { ...prev, selectedToken: token };
      console.log("Updated deposit form state:", newState);
      return newState;
    });
  };


  // Deposit to merkle tree
  async function deposit_merkle() {
    try {
      setIsLoading(true);
      setState("processing...");
      // Generate random values only if they haven't been generated yet

      randomValuesRef.current.secret = Math.floor(Math.random() * 1000) + 1;
      randomValuesRef.current.nullifier = Math.floor(Math.random() * 1000) + 1;
      console.log("Generated new random values:", randomValuesRef.current);

      const randomSecret = randomValuesRef.current.secret;
      const randomNullifier = randomValuesRef.current.nullifier;

      // Update the state with the random values
      setDepositFormState(prev => {

        const newState = {
          ...prev,
          secret: randomSecret,
          nullifier: randomNullifier
        };

        return newState;
      });

      // Use the random values directly
      const nullifier = randomNullifier;
      const secret = randomSecret;

      console.log("Using direct values:", { nullifier, secret });

      if (!publicKey) {
        alert("Connect wallet first");
        return;
      }

      if (!nullifier) {
        console.error("Nullifier is missing:", nullifier);
        alert("missing nullifier");
        return;
      }

      if (!secret) {
        alert("missing secret");
        return;
      }


      if (!depositFormState.selectedToken?.address) {
        alert("No token selected");
        return;
      }

      const nullifierR = CryptoHelper.generateAndPrepareRand(nullifier);
      const secretR = CryptoHelper.generateAndPrepareRand(secret);
      const nullifierNode = CryptoHelper.modInput(nullifierR.u8Array);
      const secretNode = CryptoHelper.modInput(secretR.u8Array);
      const commitmentBytes = CryptoHelper.from_children(
        nullifierNode,
        secretNode,
      );

      const instructions = await buildDepositTransactionInstruction({
        signer: publicKey,
        input: commitmentBytes,
        depth,
        connection,
        mint: new PublicKey(depositFormState.selectedToken?.address),
      });

      const tx = new Transaction();
      tx.add(modifyComputeUnits);
      for (const instruction of instructions) {
        tx.add(instruction);
      }

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      const txDepositHash = await sendTransaction(tx, connection, {
        skipPreflight: true,
      });


      addToast({
        title: "Deposit successful",
        color: "primary",
        endContent: (
          <div className="ms-11 my-2 flex gap-x-2">
            <Button

              size="sm"
              variant="bordered"
              onPress={() =>
                window.open(
                  `https://explorer.solana.com/tx/${txDepositHash}?cluster=${process.env.SOLANA_NETWORK}`,
                  "_blank",
                )
              }
            >
              View tx
            </Button>
          </div>
        ),
      });
      setState("generating proof");
      // await confirmation
      const status = await connection.confirmTransaction({
        signature: txDepositHash,
        ...(await connection.getLatestBlockhash()),
      });

      setIsLoading(false);
      setState("deposit");
      // Set proof data and show proof section
      const index = await getMerkleAccount1() as number
      const newProofData = {
        index: index,
        secret: randomSecret,
        nullifier: randomNullifier,
      };
      setProofData(newProofData);
      setShowProof(true);

      // Update parent state directly after successful deposit
      if (setParentDepositState) {
        setParentDepositState({
          secret: randomSecret,
          nullifier: randomNullifier,
          amount: depositFormState.amount,
          showProof: true,
          proofData: newProofData,
        });
      }

    } catch (error: any) {
      console.error("deposit_merkle", error);
      addToast({
        title: "Deposit failed",
        color: "danger",
        description: error.message,

      });
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="w-full  mx-auto py-4 px-4 shadow-none border-none w-[450px] bg-primary/20  rounded-xl">
        <div className="">
          {/* Token Row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              
                <Image
                  src={tokens[0]?.logoURI}
                  alt={tokens[0]?.symbol}
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-700"
                />
              
              <span className="font-bold  text-base">
                {tokens[0]?.symbol}
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
      {/* Balance Row */}

      <span className="text-xs text-gray-500">
        Balance: {tokens[0]?.balance?.toFixed(2)} {tokens[0]?.symbol}
      </span>

     
    
      {/* Send Button */}
      <div className="w-full">
        <WalletGuard>
          <Button
            color="primary"
            className="w-full  my-2 text-white capitalize border-fill "
            size="lg"
            onPress={() => deposit_merkle()}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {state}
          </Button>
        </WalletGuard>
         {/* How it works button */}
      <div className="w-full flex justify-start">
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button
            size="sm"
              variant="light"
              className="text-gray-500 hover:text-primary"
              endContent={<Icon icon="mdi:help-circle-outline" className="w-4 h-4" />}
            >
              How it works
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Deposit SOL into your private pool</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deposit 1 SOL into a private pool. Each pool is single-use and stores exactly 1 SOL for maximum privacy.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Get your custom secret seed</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive a unique secret seed that acts as your private key. This seed is required to access your funds.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Send SOL confidentially</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use your secret seed from any wallet to send SOL to any address. Our protocol handles the transfer privately and securely.</p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      </div>

     

      {/* ZKProof Section - Only shown after successful deposit */}
      {showProof && proofData && (
        <Card className="w-full mx-auto p-4 w-[450px] mt-4 border-2 border-yellow-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-yellow-600">
                ⚠️ IMPORTANT: Save Your ZKProof
              </h3>
            </div>

            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm text-gray-700 mb-2">
                Your ZKProof is required to withdraw your funds. If you lose
                this information, you will not be able to access your deposited
                funds.
              </p>

              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">
                  Your ZKProof (copy and save this):
                </p>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 break-all">
                  <code className="text-sm font-mono">
                    {`${proofData.index}-${proofData.nullifier}-${proofData.secret}`}
                  </code>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-red-600 font-medium">
                  Please save this information in a secure location. It cannot
                  be recovered if lost.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Deposit;
