import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Connection, GetProgramAccountsFilter } from "@solana/web3.js";
import Decimal from "decimal.js";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface Das {
    jsonrpc: string
    result: {
        total: number
        limit: number
        cursor: string
        items: Array<{
            interface: string
            id: string
            content: {
                $schema: string
                json_uri: string
                files: Array<{
                    uri: string
                    cdn_uri?: string
                    mime: string
                }>
                metadata: {
                    attributes?: Array<{
                        value: any
                        trait_type: string
                        max_value?: number
                        display_type?: string
                    }>
                    description?: string
                    name?: string
                    symbol?: string
                    token_standard?: string
                }
                links: {
                    external_url?: string
                    image?: string
                    animation_url?: string
                }
            }
            authorities: Array<{
                address: string
                scopes: Array<string>
            }>
            compression: {
                eligible: boolean
                compressed: boolean
                data_hash: string
                creator_hash: string
                asset_hash: string
                tree: string
                seq: number
                leaf_id: number
            }
            grouping: Array<{
                group_key: string
                group_value: string
            }>
            royalty: {
                royalty_model: string
                target: any
                percent: number
                basis_points: number
                primary_sale_happened: boolean
                locked: boolean
            }
            creators: Array<{
                address: string
                share: number
                verified: boolean
            }>
            ownership: {
                frozen: boolean
                delegated: boolean
                delegate: any
                ownership_model: string
                owner: string
            }
            supply?: {
                print_max_supply?: number
                print_current_supply: number
                edition_nonce?: number
                edition_number?: number
                master_edition_mint?: string
            }
            mutable: boolean
            burnt: boolean
            token_info?: {
                balance: number
                supply: number
                decimals: number
                token_program: string
                associated_token_address: string
                symbol?: string
                price_info?: {
                    price_per_token: number
                    total_price: number
                    currency: string
                }
                mint_authority?: string
                freeze_authority?: string
            }
            plugins?: {}
            mpl_core_info?: {
                plugins_json_version: number
            }
            external_plugins?: Array<any>
            mint_extensions?: {
                metadata?: {
                    uri: string
                    mint: string
                    name: string
                    symbol: string
                    update_authority: string
                    additional_metadata: Array<any>
                }
                metadata_pointer?: {
                    authority: string
                    metadata_address: string
                }
                transfer_fee_config: {
                    withheld_amount: number
                    newer_transfer_fee: {
                        epoch: number
                        maximum_fee: number
                        transfer_fee_basis_points: number
                    }
                    older_transfer_fee: {
                        epoch: number
                        maximum_fee: number
                        transfer_fee_basis_points: number
                    }
                    withdraw_withheld_authority?: string
                    transfer_fee_config_authority?: string
                }
                transfer_hook?: {
                    authority: string
                    program_id: any
                }
                permanent_delegate?: {
                    delegate: string
                }
                mint_close_authority?: {
                    close_authority: string
                }
                confidential_transfer_mint?: {
                    authority: string
                    auditor_elgamal_pubkey: any
                    auto_approve_new_accounts: boolean
                }
                confidential_transfer_fee_config?: {
                    authority: string
                    withheld_amount: Array<number>
                    harvest_to_mint_enabled: boolean
                    withdraw_withheld_authority_elgamal_pubkey: Array<number>
                }
                group_pointer?: {
                    authority: string
                    group_address: string
                }
            }
        }>
    }
    id: string
}

export interface Asset {
    chainId: number; // 101,
    address: string; // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    mint?: string;
    symbol: string; // 'USDC',
    name: string; // 'Wrapped USDC',
    decimals: number; // 6,
    logoURI: string; // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
    tags?: string[]; // [ 'stablecoin' ]
    extraData?: { balance?: string }
    balance?: number;
    price?: number;
    value?: number;
}

export async function GET(request: Request) {
    // allowCors(request, response)
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('wallet');

        
        const dasItems = await fetchAssetsBatch( address as string);  // Added type assertion
        
        const onChainAccounts = await getOnChainAccounts(address as string);
        // filter out assets that compressed = true & verify that accounts are on chain
        const filteredAccounts = dasItems.filter(asset => 
            !asset.compression.compressed && 
            asset.interface !== "V1_NFT"
        );

        //aggregate the assets to fit the Asset interface
         //aggregate the assets to fit the Asset interface
         const assets: Asset[] = (await Promise.all(
            filteredAccounts.filter(async asset => asset.content.metadata.name != "Wrapped SOL" && (asset.interface == "FungibleToken" || asset.interface == "NonFungibleToken")).map(async asset => {
                const balance = asset.token_info?.balance ? 
                    Number(new Decimal(asset.token_info.balance.toString()).div(10 ** (asset.token_info.decimals || 0)).toString()) 
                    : 0;
                const price = asset.token_info?.price_info?.price_per_token || 0;
                let logoURI = asset?.content?.links?.image;
                let name = asset.content.metadata.name || asset?.token_info?.symbol
                if (!logoURI) {
                    logoURI = ''
                }
                if (!name) {
                    name = 'Unknown'
                    if (asset.interface === 'FungibleAsset' || asset.interface === 'FungibleToken') {
                        name = 'SPL Token'
                    }
                    if (asset.interface === 'NonFungibleToken') {
                        name = 'NFT Token'
                    }
                }
                const assetData = {
                    chainId: 101,
                    address: asset.id,
                    symbol: asset?.token_info?.symbol || asset.content.metadata.symbol,
                    mint: asset?.token_info?.associated_token_address,
                    name,
                    decimals: asset.token_info?.decimals,
                    logoURI,
                    balance,
                    price,
                    value: balance * price,
                    frozen: asset.ownership.frozen
                }
                return assetData
            })))
        return NextResponse.json(assets)
    } catch (error) {
        console.error(error)
    }
}


async function getOnChainAccounts(wallet: string): Promise<string[]> {
    const filters: GetProgramAccountsFilter[] = [
        {
            dataSize: 165,    //size of account (bytes)
        },
        {
            memcmp: {
                offset: 32,     //location of our query in the account (bytes)
                bytes: wallet,  //our search criteria, a base58 encoded string
            }
        }
    ];
    const connection = new Connection(process.env.SOLANA_RPC_SERVER as string, 'processed');
    const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,   //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        { filters }
    );

    // @ts-ignore
    return accounts.map(account => account?.account?.data["parsed"]["info"]["mint"]);
}

async function fetchAssetsBatch(walletAddress: string, attempts: number = 0, allItems: any[] = []): Promise<any[]> {
    if (attempts >= 3) {
        return allItems;
    }

    try {
        const res = await axios.post(process.env.SOLANA_RPC_SERVER as string, {
            jsonrpc: "2.0",
            id: "text",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: walletAddress,
                page: attempts + 1,
                options: {
                    showFungible: true,
                    showZeroBalance: false
                }
            }
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        const data = res.data as Das;
        console.log('iteration', attempts, data.result.items);
        const newItems = [...allItems, ...data.result.items];
        
        if (attempts < 2 && data.result.items.length > 1000) {
            return await fetchAssetsBatch(walletAddress, attempts + 1, newItems);
        }
        
        return newItems;
    } catch (error) {
        console.error('Error fetching assets batch:', error);
        return allItems;
    }
}