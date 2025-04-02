#![allow(unused_imports)]
mod error;
mod instructions;
mod state;
mod utils;
mod withdraw20_verifying_key;
mod withdraw3_verifying_key;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("4BEBe7TVDef5Nfdft252mMCSNBBmPLQ2gVXmKvJvSbP1");

#[program]
pub mod zklsol {
    use super::*;

    pub fn close_pda_account(ctx: Context<ClosePdaAccount>) -> Result<()> {
        close_pda_account::close_pda_account(ctx)
    }

    pub fn dump_proof(ctx: Context<DumpProof>) -> Result<()> {
        dump_proof::dump_proof(ctx)
    }

    pub fn deactivate_address_lookup_table(
        ctx: Context<DeactivateAddressLookupTable>,
    ) -> Result<()> {
        deactivate_address_lookup_table::deactivate_address_lookup_table(ctx)
    }

    pub fn close_address_lookup_table(ctx: Context<CloseAddressLookupTable>) -> Result<()> {
        close_address_lookup_table::close_address_lookup_table(ctx)
    }
    pub fn extend_address_lookup_table(ctx: Context<ExtendAddressLookupTable>) -> Result<()> {
        extend_address_lookup_table::extend_address_lookup_table(ctx)
    }

    pub fn create_address_lookup_table(
        ctx: Context<CreateAddressLookupTable>,
        args: CreateAddressLookupTableArgs,
    ) -> Result<()> {
        create_address_lookup_table::create_address_lookup_table(ctx, args)
    }

    pub fn withdraw(ctx: Context<WithdrawContext>, args: WithdrawArgs) -> Result<()> {
        withdraw::withdraw(ctx, args)
    }

    pub fn deposit(ctx: Context<DepositContext>, args: DepositArgs) -> Result<()> {
        deposit::deposit(ctx, args)
    }

    pub fn create_merkle(ctx: Context<CreateMerkle>, args: CreateMerkleArgs) -> Result<()> {
        create_merkle::create_merkle(ctx, args)
    }

    pub fn create_merkle_node(
        ctx: Context<CreateMerkleNode>,
        args: CreateMerkleNodeArgs,
    ) -> Result<()> {
        create_merkle_node::create_merkle_node(ctx, args)
    }
}
