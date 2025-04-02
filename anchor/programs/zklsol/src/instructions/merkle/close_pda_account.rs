use crate::state::merkle_state::MerkleState;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use crate::utils::close_account;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClosePdaAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: account to close
    #[account(mut)]
    pub account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn close_pda_account(ctx: Context<ClosePdaAccount>) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let account = &mut ctx.accounts.account;
    close_account(
        &mut account.to_account_info(),
        &mut signer.to_account_info(),
    )?;
    Ok(())
}
