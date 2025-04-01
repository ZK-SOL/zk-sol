import {Keypair, LAMPORTS_PER_SOL} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {airdrop, processTransaction} from "../solita/sol-helpers";
import {Zklsol} from "../target/types/zklsol";
import {
    buildCloseAddressLookupTableInstruction,
    buildCreateAddressLookupTableInstruction, buildDeactivateAddressLookupTableInstruction,
    buildExtendAddressLookupTableInstruction
} from "../solita/wrappers/user_address_lookup_table_wrapper";
import assert from "assert";
import {getMerkleAddress, getMerkleZerosAddress} from "../solita/pda/merkle_pda";
import {getUserAddressLookupTableAccount} from "../solita/pda/user_address_lookup_table_pda";
import {sleep} from "../solita/generic-helpers";

const signer = Keypair.generate()

describe("Address Lookup Table", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.Zklsol as Program<Zklsol>;
    const depth = 5;

    it("airdrop", async () => {
        for (const key of [signer]) {
            await airdrop(program, key.publicKey, LAMPORTS_PER_SOL * 50_000)
        }
    })

    it("create address table lookup", async () => {
        const instruction = await buildCreateAddressLookupTableInstruction({
            signer: signer.publicKey,
            connection: program.provider.connection
        })
        const sig = await processTransaction(
            [instruction],
            program.provider.connection,
            signer,
        )
        const txn = await program.provider.connection.getParsedTransaction(
            sig.Signature,
            'confirmed'
        )
        assert.equal(
            sig.SignatureResult.err,
            null,
            `${txn?.meta?.logMessages.join('\n')}`
        )
    })

    it("extend address lookup table", async () => {
        const [merkle] = getMerkleAddress(depth);
        const [merkleZeros] = getMerkleZerosAddress(depth);
        const instruction = await buildExtendAddressLookupTableInstruction({
            signer: signer.publicKey,
            connection: program.provider.connection,
            remainingAccounts: [merkle, merkleZeros, signer.publicKey],
            writeable: false
        })
        const sig = await processTransaction(
            [instruction],
            program.provider.connection,
            signer,
        )
        const txn = await program.provider.connection.getParsedTransaction(
            sig.Signature,
            'confirmed'
        )
        assert.equal(
            sig.SignatureResult.err,
            null,
            `${txn?.meta?.logMessages.join('\n')}`
        )
    })

    it("deactivate address lookup table", async () => {
        const instruction = await buildDeactivateAddressLookupTableInstruction({
            signer: signer.publicKey,
            connection: program.provider.connection
        });
        const sig = await processTransaction(
            [instruction],
            program.provider.connection,
            signer,
        )
        const txn = await program.provider.connection.getParsedTransaction(
            sig.Signature,
            'confirmed'
        )
        assert.equal(
            sig.SignatureResult.err,
            null,
            `${txn?.meta?.logMessages.join('\n')}`
        )
    })

    // it("Close address lookup table", async () => {
    //     const initBlockData = await program.provider.connection.getLatestBlockhash();
    //     while (true) {
    //         const blockData = await program.provider.connection.getLatestBlockhash();
    //         const userAddressLookupTableAccount = await getUserAddressLookupTableAccount(program.provider.connection, signer.publicKey);
    //         const lookupTableAccount = (await program.provider.connection.getAddressLookupTable(userAddressLookupTableAccount.addressLookupTable)).value;
    //         const slot = await program.provider.connection.getSlot();
    //         console.log("state", blockData.lastValidBlockHeight, slot, lookupTableAccount.state)
    //         if (blockData.lastValidBlockHeight > initBlockData.lastValidBlockHeight + 100 && slot > lookupTableAccount.state.deactivationSlot && slot > lookupTableAccount.state.lastExtendedSlot) {
    //             break
    //         }
    //         await sleep(1_000)
    //     }
    //     const instruction = await buildCloseAddressLookupTableInstruction({
    //         signer: signer.publicKey,
    //         connection: program.provider.connection,
    //     })
    //     const sig = await processTransaction(
    //         [instruction],
    //         program.provider.connection,
    //         signer,
    //     )
    //     const txn = await program.provider.connection.getParsedTransaction(
    //         sig.Signature,
    //         'confirmed'
    //     )
    //     assert.equal(
    //         sig.SignatureResult.err,
    //         null,
    //         `${txn?.meta?.logMessages.join('\n')}`
    //     )
    // })
});