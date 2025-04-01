import {AddressLookupTableProgram, Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {
    CloseAddressLookupTableInstructionAccounts,
    CreateAddressLookupTableInstructionAccounts,
    CreateAddressLookupTableInstructionArgs, createCloseAddressLookupTableInstruction,
    createCreateAddressLookupTableInstruction, createDeactivateAddressLookupTableInstruction,
    createExtendAddressLookupTableInstruction, DeactivateAddressLookupTableInstructionAccounts,
    ExtendAddressLookupTableInstructionAccounts
} from "../instructions";
import {getUserAddressLookupTableAccount, getUserAddressLookupTableAddress} from "../pda/user_address_lookup_table_pda";
import {toAccountMeta} from "../sol-helpers";


export type BuildCreateAddressLookupTableInstructionInputs = {
    signer: PublicKey,
    connection: Connection
}

export async function buildCreateAddressLookupTableInstruction({
                                                                   signer,
                                                                   connection

                                                               }: BuildCreateAddressLookupTableInstructionInputs): Promise<TransactionInstruction> {
    const [userAddressLookupTable] = getUserAddressLookupTableAddress(signer);
    const addressLookupTableProgram = AddressLookupTableProgram.programId;
    const recentSlot = await connection.getSlot();
    const [_, addressLookupTable] =
        AddressLookupTableProgram.createLookupTable({
            authority: userAddressLookupTable,
            payer: signer,
            recentSlot: recentSlot,
        });
    const args: CreateAddressLookupTableInstructionArgs = {
        args: {
            recentSlot
        }
    }
    const accounts: CreateAddressLookupTableInstructionAccounts = {
        signer,
        addressLookupTableProgram,
        userAddressLookupTable,
        addressLookupTable
    }
    return createCreateAddressLookupTableInstruction(accounts, args)
}

export type BuildExtendAddressLookupTableInstructionInputs = {
    signer: PublicKey;
    connection: Connection;
    remainingAccounts: PublicKey[];
    writeable: boolean
}

export async function buildExtendAddressLookupTableInstruction({
                                                                   signer,
                                                                   connection,
                                                                   remainingAccounts,
                                                                   writeable
                                                               }: BuildExtendAddressLookupTableInstructionInputs): Promise<TransactionInstruction> {
    const [userAddressLookupTable] = getUserAddressLookupTableAddress(signer);
    const userAddressLookupTableAccount = await getUserAddressLookupTableAccount(connection, signer);
    const addressLookupTableProgram = AddressLookupTableProgram.programId;
    const accounts: ExtendAddressLookupTableInstructionAccounts = {
        signer,
        userAddressLookupTable,
        addressLookupTableProgram,
        addressLookupTable: userAddressLookupTableAccount.addressLookupTable,
        anchorRemainingAccounts: remainingAccounts.map(i => toAccountMeta(i, writeable))
    }
    return createExtendAddressLookupTableInstruction(accounts);
}

export type BuildDeactivateAddressLookupTableInstructionInputs = {
    signer: PublicKey;
    connection: Connection;
}

export async function buildDeactivateAddressLookupTableInstruction({
                                                                       signer,
                                                                       connection
                                                                   }: BuildDeactivateAddressLookupTableInstructionInputs): Promise<TransactionInstruction> {
    const [userAddressLookupTable] = getUserAddressLookupTableAddress(signer);
    const userAddressLookupTableAccount = await getUserAddressLookupTableAccount(connection, signer);
    const addressLookupTableProgram = AddressLookupTableProgram.programId;
    const accounts: DeactivateAddressLookupTableInstructionAccounts = {
        signer,
        userAddressLookupTable,
        addressLookupTableProgram,
        addressLookupTable: userAddressLookupTableAccount.addressLookupTable,
    }
    return createDeactivateAddressLookupTableInstruction(accounts)
}

export type BuildCloseAddressLookupTableInstructionInputs = {
    signer: PublicKey;
    connection: Connection;
}

export async function buildCloseAddressLookupTableInstruction({
                                                                  signer,
                                                                  connection
                                                              }: BuildCloseAddressLookupTableInstructionInputs): Promise<TransactionInstruction> {
    const [userAddressLookupTable] = getUserAddressLookupTableAddress(signer);
    const userAddressLookupTableAccount = await getUserAddressLookupTableAccount(connection, signer);
    const addressLookupTableProgram = AddressLookupTableProgram.programId;
    const accounts: CloseAddressLookupTableInstructionAccounts = {
        signer,
        userAddressLookupTable,
        addressLookupTableProgram,
        addressLookupTable: userAddressLookupTableAccount.addressLookupTable,
    }
    return createCloseAddressLookupTableInstruction(accounts);
}

