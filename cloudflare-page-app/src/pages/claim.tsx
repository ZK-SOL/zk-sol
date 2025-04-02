import FormMain from '../components/FormMain'
import MenuMain from '../components/MenuMain'
import styles from './claim.module.css'
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {useConnection, useWallet} from '@solana/wallet-adapter-react'

import {
    LAMPORTS_PER_SOL, PublicKey,
    Transaction
} from '@solana/web3.js'
import {
    buildClosePdaAccountTransactionInstruction,
    buildCreateMerkleTransactionInstruction,
    buildDepositTransactionInstruction,
    buildWithdrawTransactionInstruction,
    GenerateProofPath
} from "../solita/wrappers/merkle_wrapper.ts";
import {modifyComputeUnits} from "../solita/sol-helpers.ts";
import {NATIVE_MINT} from "@solana/spl-token";
import {CryptoHelper} from "../solita/crypto-helpers.ts";
import {
    getMerkleAccount,
    getMerkleAddress,
    getMerkleNodeAccount,
    getMerkleZerosAddress
} from "../solita/pda/merkle_pda.ts";
import {run_circuit, ZkHelper} from "../solita/zk-helper.ts";

const Claim = () => {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const walletContextState = useWallet()
    const {connection} = useConnection()
    const [address, _setAddress] = useState('')
    const [_, setDisplayedAddress] = useState('')
    const [nullifer, setNullifer] = useState<number>();
    const [secret, setSecret] = useState<number>();
    const [depth, setDepth] = useState<number>(20)
    const [merkleAddress, setMerkleAddress] = useState<PublicKey>();
    const [merkleZeros, setMerkleZeros] = useState<PublicKey>();
    const [index, setIndex] = useState<number>();
    const [recipient, setRecipient] = useState<PublicKey>(new PublicKey("8ztKyNZ6PmhsB7VEzi19h3Mk1TPqW3zZ8Pd4bshcv2y4"));
    const [circutName, setCircuitName] = useState<string>(`withdraw${depth}`);
    const [closePdaAccount, setClosePdaAccount] = useState<PublicKey>();


    useEffect(() => {
        (async () => {
            if (!walletContextState.connected) {
                await navigate('/')
            }
        })()
    }, [walletContextState.connected])

    useEffect(() => {
        const [merkle] = getMerkleAddress(depth);
        const [merkleZeros] = getMerkleZerosAddress(depth)
        setMerkleAddress(merkle)
        setMerkleZeros(merkleZeros)
        setCircuitName(`withdraw${depth}`)
    }, [depth])

    async function close_pda() {
        if (!walletContextState.publicKey) {
            alert("Connect wallet first")
            return
        }
        if (!closePdaAccount) {
            alert("no close pda");
            return
        }
        const close_pda_account = buildClosePdaAccountTransactionInstruction({
            signer: walletContextState.publicKey,
            account: closePdaAccount
        })
        const tx = new Transaction();
        tx.add(modifyComputeUnits)
        tx.add(close_pda_account);
        const block = await connection.getLatestBlockhash();
        console.log("connection", connection.rpcEndpoint)
        tx.recentBlockhash = block.blockhash;
        tx.lastValidBlockHeight = block.lastValidBlockHeight;
        tx.feePayer = walletContextState.publicKey;
        const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {
            skipPreflight: true,
            preflightCommitment: "confirmed"
        });
        console.log('close_pda', txDespoitHash)
    }

    async function close_merkle() {
        try {
            if (!walletContextState.publicKey) {
                alert("Connect wallet first")
                return
            }
            if (!merkleAddress) {
                alert("no merkle address")
                return
            }
            if (!merkleZeros) {
                alert("no merkle zeros")
                return
            }

            const close_merkle_instruction = buildClosePdaAccountTransactionInstruction({
                signer: walletContextState.publicKey,
                account: merkleAddress
            })
            const close_merkle_zeros_instruction = buildClosePdaAccountTransactionInstruction({
                signer: walletContextState.publicKey,
                account: merkleZeros
            })
            const tx = new Transaction();
            tx.add(modifyComputeUnits)
            tx.add(close_merkle_instruction);
            tx.add(close_merkle_zeros_instruction);
            const block = await connection.getLatestBlockhash();
            console.log("connection", connection.rpcEndpoint)
            tx.recentBlockhash = block.blockhash;
            tx.lastValidBlockHeight = block.lastValidBlockHeight;
            tx.feePayer = walletContextState.publicKey;
            const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {
                skipPreflight: true,
                preflightCommitment: "confirmed"
            });
            console.log('close_merkle', txDespoitHash)
        } catch (error: any) {
            console.error("close_merkle", error)
        }
    }

    async function create_merkle() {
        try {
            if (!walletContextState.publicKey) {
                alert("Connect wallet first")
                return
            }
            const instruction = buildCreateMerkleTransactionInstruction({
                signer: walletContextState.publicKey,
                depth,
                depositSize: LAMPORTS_PER_SOL,
                mint: NATIVE_MINT
            })
            const tx = new Transaction();
            tx.add(modifyComputeUnits)
            tx.add(instruction);
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = walletContextState.publicKey;
            const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {skipPreflight: true});
            console.log('create_merkle', txDespoitHash)
        } catch (error: any) {
            console.error("create_merkle", error)
        }
    }

    async function deposit_merkle() {
        if (!walletContextState.publicKey) {
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
        const nulliferR = CryptoHelper.generateAndPrepareRand(nullifer);
        const secretR = CryptoHelper.generateAndPrepareRand(secret);
        const nullifierNode = CryptoHelper.modInput(nulliferR.u8Array);
        const secretNode = CryptoHelper.modInput(secretR.u8Array);
        const commitmentBytes = CryptoHelper.from_children(
            nullifierNode,
            secretNode
        );
        const instructions = await buildDepositTransactionInstruction({
            signer: walletContextState.publicKey,
            input: commitmentBytes,
            depth,
            connection
        })
        const tx = new Transaction();
        tx.add(modifyComputeUnits)
        for (const instruction of instructions) {
            tx.add(instruction);
        }
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = walletContextState.publicKey;
        const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {skipPreflight: true});
        console.log('deposit_merkle', txDespoitHash)
    }

    async function withdraw_merkle() {
        if (!walletContextState.publicKey) {
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
        if (recipient.toBase58() === walletContextState.publicKey.toBase58()) {
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
            signer: walletContextState.publicKey,
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
        tx.feePayer = walletContextState.publicKey;
        const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {skipPreflight: true});
        console.log('withdraw_merkle', txDespoitHash)
    }

    useEffect(() => {
        setDisplayedAddress(`${address.slice(0, 4)}…${address.slice(-4)}`)
    }, [address])

    async function disconnect() {
        console.log('disconnect')
        if (walletContextState.publicKey && connection) {
            await walletContextState.disconnect()
            await navigate('/')
        } else {
            setError('Please connect wallet')
        }
    }

    return (
        <>
            <MenuMain current="claiming"/>
            <FormMain
                aria-busy={true}
                data-current-item="claiming"
            >
                {!!error &&
                    (
                        <output className="error">
                            {error}
                        </output>
                    )
                }
            </FormMain>
            <button type="button" className={`ghost ${styles.button}`} onClick={disconnect}>
                <u>Connect another wallet</u>
            </button>

            <div>
                <hr/>
                test area
                <hr/>

                <h1>merkle</h1>
                <input type={"text"} width={"100%"} disabled={true} value={merkleAddress?.toBase58()}/>
                <br/>
                <h1>merkle zeros</h1>
                <input type={"text"} width={"100%"} disabled={true} value={merkleZeros?.toBase58()}/>
                <br/>
                <hr/>
                <h1>close pda</h1>
                <input type={"text"} width={"100%"} value={closePdaAccount?.toBase58()} onChange={e => {
                    try {
                        const p = new PublicKey(e.target.value)
                        setClosePdaAccount(p)
                    } catch (error) {
                    }
                }}/>
                <br/>
                <hr/>
                <h1>depth</h1>
                <input type={"number"} step={1} onChange={e => setDepth(parseInt(e.target.value))}
                       placeholder={`Depth ${depth}`} value={depth}/>
                <h1>nullifer</h1>
                <input type={"number"} step={1} onChange={e => setNullifer(parseInt(e.target.value))}
                       placeholder={`Nullifer ${nullifer}`} value={nullifer}/>
                <h1>secret</h1>
                <input type={"number"} step={1} onChange={e => setSecret(parseInt(e.target.value))}
                       placeholder={`Secret ${secret}`} value={secret}/>
                <br/>
                <h1>index</h1>
                <input type={"number"} step={1} onChange={e => setIndex(parseInt(e.target.value))}
                       placeholder={`Index ${index}`} value={index}/>
                <br/>
                <h1>recipient</h1>
                <input type={"text"} width={"100%"} value={recipient.toBase58()} onChange={e => {
                    try {
                        const p = new PublicKey(e.target.value);
                        setRecipient(p)
                    } catch (error) {
                    }
                }}/>
                <br/>
                <button className={`ghost ${styles.button}`} onClick={close_pda}>
                    Close PDA
                </button>
                <br/>
                <button className={`ghost ${styles.button}`} onClick={close_merkle}>
                    Close Merkle
                </button>
                <br/>
                <button className={`ghost ${styles.button}`} onClick={create_merkle}>
                    Create Merkle
                </button>
                <br/>
                <button className={`ghost ${styles.button}`} onClick={deposit_merkle}>
                    Deposit
                </button>
                <br/>
                <button className={`ghost ${styles.button}`} onClick={withdraw_merkle}>
                    Withdraw
                </button>
                <br/>
            </div>
        </>
    )
}
export default Claim
