import {Connection, PublicKey} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {UserAddressLookupTableSeed} from "../constants/seeds";
import {PROGRAM_ID, UserAddressLookupTable} from "../index";


export function getUserAddressLookupTableAddress(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(anchor.utils.bytes.utf8.encode(UserAddressLookupTableSeed)),
            user.toBuffer()
        ],
        PROGRAM_ID
    )
}

export async function getUserAddressLookupTableAccount(connection: Connection, user: PublicKey): Promise<UserAddressLookupTable> {
    const [userAddressLookupTable] = getUserAddressLookupTableAddress(user);
    return await UserAddressLookupTable.fromAccountAddress(connection, userAddressLookupTable)
}