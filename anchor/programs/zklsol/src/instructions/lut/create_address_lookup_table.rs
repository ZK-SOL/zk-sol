use crate::error::ErrorCodes;
use crate::state::merkle_state::MerkleState;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use crate::state::user_address_lookup_table::UserAddressLookupTable;
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::address_lookup_table::instruction::{
    create_lookup_table, derive_lookup_table_address,
};
use anchor_lang::solana_program::address_lookup_table::state::AddressLookupTable;
use anchor_lang::solana_program::log::sol_log;
use std::str::FromStr;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateAddressLookupTableArgs {
    pub recent_slot: u64,
}

#[derive(Accounts)]
#[instruction(args: CreateAddressLookupTableArgs)]
pub struct CreateAddressLookupTable<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(address =  Pubkey::from_str("AddressLookupTab1e1111111111111111111111111").unwrap())]
    pub address_lookup_table_program: UncheckedAccount<'info>,
    /// CHECK: Checking inside
    #[account(mut)]
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(
    init,
    payer = signer,
    seeds = [UserAddressLookupTable::SEED.as_bytes().as_ref(), signer.key().as_ref()],
    space = UserAddressLookupTable::SIZE,
    bump
    )]
    pub user_address_lookup_table: Box<Account<'info, UserAddressLookupTable>>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_address_lookup_table(
    ctx: Context<CreateAddressLookupTable>,
    args: CreateAddressLookupTableArgs,
) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let user_address_lookup_table = &mut ctx.accounts.user_address_lookup_table;
    let address_lookup_table = &mut ctx.accounts.address_lookup_table;
    user_address_lookup_table.bump = ctx.bumps.user_address_lookup_table;
    user_address_lookup_table.signer = signer.key();
    user_address_lookup_table.address_lookup_table = address_lookup_table.key();
    let (ix, address) = create_lookup_table(
        user_address_lookup_table.key(),
        signer.key(),
        args.recent_slot,
    );
    require_keys_eq!(
        address,
        address_lookup_table.key(),
        ErrorCodes::InvalidLookupTable
    );
    solana_program::program::invoke(
        &ix,
        &[
            signer.to_account_info(),
            address_lookup_table.to_account_info(),
            user_address_lookup_table.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.address_lookup_table_program.to_account_info(),
        ],
    )?;
    Ok(())
}
