use crate::state::merkle_state::MerkleState;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMerkleArgs {
    pub depth: u64,
    pub deposit_size: u64,
}

#[derive(Accounts)]
#[instruction(args: CreateMerkleArgs)]
pub struct CreateMerkle<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init,
    payer = signer,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), args.depth.to_le_bytes().as_ref()],
    space = MerkleState::SIZE,
    bump
    )]
    pub merkle: Box<Account<'info, MerkleState>>,
    #[account(
    init,
    payer = signer,
    token::mint = mint,
    token::authority = merkle,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), args.depth.to_le_bytes().as_ref(), mint.key().as_ref()],
    bump
    )]
    pub merkle_token_account: Box<Account<'info, TokenAccount>>,
    #[account(init,
    payer = signer,
    seeds = [MerkleZeros::SEED.as_bytes().as_ref(), args.depth.to_le_bytes().as_ref()],
    space = MerkleZeros::SIZE,
    bump
    )]
    pub merkle_zeros: Box<Account<'info, MerkleZeros>>,
    pub mint: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_merkle(ctx: Context<CreateMerkle>, args: CreateMerkleArgs) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let merkle = &mut ctx.accounts.merkle;
    let merkle_zeros = &mut ctx.accounts.merkle_zeros;
    let zeros = MerkleZeros::new(args.depth as u8, ctx.bumps.merkle_zeros);
    let m = MerkleTree::new(args.depth as u8, &zeros)?;
    merkle_zeros.bump = ctx.bumps.merkle_zeros;
    merkle_zeros.zeros = zeros.zeros;
    merkle.bump = ctx.bumps.merkle;
    merkle.mint = mint.key();
    merkle.deposit_size = args.deposit_size;
    merkle.number_of_deposits = 0;
    merkle.lowest_pending_proof_index = 0;
    merkle.highest_pending_proof_index = 0;
    merkle.sync(m);
    Ok(())
}
