use crate::state::merkle_state::MerkleState;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use crate::utils::close_account;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseMerkle<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump = merkle.bump
    )]
    pub merkle: Box<Account<'info, MerkleState>>,
    #[account(mut,
    seeds = [MerkleZeros::SEED.as_bytes().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump = merkle_zeros.bump
    )]
    pub merkle_zeros: Box<Account<'info, MerkleZeros>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn close_merkle(ctx: Context<CloseMerkle>) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let merkle = &mut ctx.accounts.merkle;
    let merkle_zeros = &mut ctx.accounts.merkle_zeros;
    close_account(&mut merkle.to_account_info(), &mut signer.to_account_info())?;
    close_account(
        &mut merkle_zeros.to_account_info(),
        &mut signer.to_account_info(),
    )?;
    Ok(())
}
