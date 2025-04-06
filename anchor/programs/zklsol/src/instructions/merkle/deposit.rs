use crate::error::ErrorCodes;
use crate::state::merkle_proof::PathElement;
use crate::state::merkle_state::{MerkleNodeState, MerklePendingProofState, MerkleState};
use crate::state::merkle_zeros::MerkleZeros;
use crate::utils::{
    clone_account_info, create_pda_account, is_native, transfer_sol, transfer_token,
    unsafe_clone_account_info,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::log::{sol_log, sol_log_compute_units};
use anchor_lang::solana_program::poseidon::{hashv, Endianness, Parameters};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositArgs {
    pub input: [u8; 32],
}

#[derive(Accounts)]
#[instruction(args: DepositArgs)]
pub struct DepositContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = signer
    )]
    pub signer_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
    has_one = mint,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump = merkle.bump
    )]
    pub merkle: Box<Account<'info, MerkleState>>,
    #[account(
    mut,
    token::mint = mint,
    token::authority = merkle,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), merkle.depth.to_le_bytes().as_ref(), mint.key().as_ref()],
    bump
    )]
    pub merkle_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
    seeds = [MerkleZeros::SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump = merkle_zeros.bump
    )]
    pub merkle_zeros: Box<Account<'info, MerkleZeros>>,
    #[account(init,
    seeds = [MerklePendingProofState::SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref(), merkle.next_index.to_le_bytes().as_ref()],
    payer = signer,
    space = MerklePendingProofState::SIZE,
    bump
    )]
    pub pending_proof: Box<Account<'info, MerklePendingProofState>>,
    pub token_program: Program<'info, Token>,
    pub mint: Box<Account<'info, Mint>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn deposit(ctx: Context<DepositContext>, args: DepositArgs) -> Result<()> {
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let merkle_token_account = &ctx.accounts.merkle_token_account;
    let signer_token_account = &ctx.accounts.signer_token_account;
    let mint = &ctx.accounts.mint;
    let signer = &mut ctx.accounts.signer;
    let merkle = &mut ctx.accounts.merkle;
    let merkle_zeros = &mut ctx.accounts.merkle_zeros;
    let pending_proof = &mut ctx.accounts.pending_proof;
    let hash = hashv(Parameters::Bn254X5, Endianness::BigEndian, &[&args.input]);
    require!(hash.is_ok(), ErrorCodes::ValueCantBePoseidonHashed);
    pending_proof.bump = ctx.bumps.pending_proof;
    pending_proof.index = merkle.next_index;
    msg!("pending_proof.index = {}", merkle.next_index);
    pending_proof.depth = merkle.depth;
    let mut m = merkle.to_merkle_tree();
    let proof = m.insert(&args.input, &merkle_zeros)?;
    pending_proof.proof = proof;
    merkle.number_of_deposits += 1;
    merkle.highest_pending_proof_index += 1;
    merkle.sync(m);
    if is_native(&mint.to_account_info()) {
        transfer_sol(
            signer.to_account_info(),
            merkle.to_account_info(),
            system_program.to_account_info(),
            merkle.deposit_size,
        )?;
    } else {
        transfer_token(
            signer_token_account.to_account_info(),
            merkle_token_account.to_account_info(),
            token_program.to_account_info(),
            signer.to_account_info(),
            merkle.deposit_size,
        )?;
    }
    Ok(())
}
