import FormMain from '../components/FormMain'
import MenuMain from '../components/MenuMain'
import styles from './claim.module.css'
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {useConnection, useWallet} from '@solana/wallet-adapter-react'

import {
    LAMPORTS_PER_SOL,
    Transaction
} from '@solana/web3.js'
import {
    buildCloseMerkleTransactionInstruction,
    buildCreateMerkleTransactionInstruction, buildDepositTransactionInstruction
} from "../solita/wrappers/merkle_wrapper.ts";
import {modifyComputeUnits} from "../solita/sol-helpers.ts";
import {NATIVE_MINT} from "@solana/spl-token";
import {CryptoHelper} from "../solita/crypto-helpers.ts";

const Claim = () => {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const walletContextState = useWallet()
    const {connection} = useConnection()
    const [address, _setAddress] = useState('')
    const [_, setDisplayedAddress] = useState('')
    const nullifer = CryptoHelper.generateAndPrepareRand(111);
    const secret = CryptoHelper.generateAndPrepareRand(222);

    const depth = 20;

    useEffect(() => {
        (async () => {
            if (!walletContextState.connected) {
                await navigate('/')
            }
        })()
    }, [walletContextState.connected])


    async function close_merkle() {
        try {
            if (!walletContextState.publicKey) {
                alert("Connect wallet first")
                return
            }
            console.log("walletContextState.publicKey", walletContextState.publicKey.toBase58())
            const instruction = buildCloseMerkleTransactionInstruction({
                signer: walletContextState.publicKey,
                depth
            })
            const tx = new Transaction();
            tx.add(modifyComputeUnits)
            tx.add(instruction);
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
        let i = 0;
        console.log("i = ", i++)
        const nullifierNode = CryptoHelper.modInput(nullifer.u8Array);
        console.log("i = ", i++)
        const secretNode = CryptoHelper.modInput(secret.u8Array);
        console.log("i = ", i++)
        const commitmentBytes = CryptoHelper.from_children(
            nullifierNode,
            secretNode
        );
        console.log("i = ", i++)
        const instructions = await buildDepositTransactionInstruction({
            signer: walletContextState.publicKey,
            input: commitmentBytes,
            depth,
            connection
        })
        console.log("i = ", i++)
        const tx = new Transaction();
        tx.add(modifyComputeUnits)
        for (const instruction of instructions) {
            tx.add(instruction);
        }
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = walletContextState.publicKey;
        console.log("i = ", i++)
        const txDespoitHash = await walletContextState.sendTransaction(tx, connection, {skipPreflight: true});
        console.log('deposit_merkle', txDespoitHash)
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
                <button className={`ghost ${styles.button}`}>
                    Withdraw
                </button>
                <br/>
            </div>
        </>
    )
}
export default Claim
