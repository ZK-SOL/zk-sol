use crate::error::ErrorCodes;
use crate::state::merkle_state::MerkleState;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use crate::state::user_address_lookup_table::UserAddressLookupTable;
use crate::utils::clone_account_info;
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::address_lookup_table::instruction::{
    close_lookup_table, deactivate_lookup_table, derive_lookup_table_address, extend_lookup_table,
};
use anchor_lang::solana_program::address_lookup_table::state::AddressLookupTable;
use anchor_lang::solana_program::log::sol_log;
use std::str::FromStr;

#[derive(Accounts)]
pub struct DeactivateAddressLookupTable<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(address =  Pubkey::from_str("AddressLookupTab1e1111111111111111111111111").unwrap())]
    pub address_lookup_table_program: UncheckedAccount<'info>,
    /// CHECK: Checking inside
    #[account(mut)]
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(
    mut,
    has_one = address_lookup_table,
    has_one = signer,
    seeds = [UserAddressLookupTable::SEED.as_bytes().as_ref(), signer.key().as_ref()],
    bump = user_address_lookup_table.bump
    )]
    pub user_address_lookup_table: Box<Account<'info, UserAddressLookupTable>>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn deactivate_address_lookup_table(ctx: Context<DeactivateAddressLookupTable>) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let user_address_lookup_table = &mut ctx.accounts.user_address_lookup_table;
    let address_lookup_table = &ctx.accounts.address_lookup_table;
    let system_program = &ctx.accounts.system_program;
    let binding = signer.key();
    let seeds = &[
        UserAddressLookupTable::SEED.as_bytes(),
        binding.as_ref(),
        &[user_address_lookup_table.bump],
    ];
    let ix = deactivate_lookup_table(address_lookup_table.key(), user_address_lookup_table.key());
    solana_program::program::invoke_signed(
        &ix,
        &[
            signer.to_account_info(),
            system_program.to_account_info(),
            address_lookup_table.to_account_info(),
            user_address_lookup_table.to_account_info(),
        ],
        &[seeds],
    )?;
    Ok(())
}
