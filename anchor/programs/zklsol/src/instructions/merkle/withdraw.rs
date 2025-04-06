use crate::error::ErrorCodes;
use crate::state::merkle_state::{MerkleState, NullifierHash};
use crate::utils::{change_endianness, is_native, transfer_sol_from_pda, transfer_token_pda};
use crate::withdraw20_verifying_key::VERIFYINGKEY as VERIFYINGKEY20;
use crate::withdraw3_verifying_key::VERIFYINGKEY as VERIFYINGKEY3;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize, Compress, Validate};
use groth16_solana::groth16::Groth16Verifier;
use std::ops::Neg;

type G1 = ark_bn254::g1::G1Affine;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawArgs {
    pub nullifier_hash: [u8; 32],
    pub proof: [u8; 256],
    pub root: [u8; 32],
}

#[derive(Accounts)]
#[instruction(args: WithdrawArgs)]
pub struct WithdrawContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
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
    seeds = [MerkleState::TOKEN_SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump
    )]
    pub merkle_token_account: Box<Account<'info, TokenAccount>>,
    /// Check can be any account
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(
    init_if_needed,
    payer = signer,
    associated_token::mint = mint,
    associated_token::authority = recipient
    )]
    pub recipient_token_account: Box<Account<'info, TokenAccount>>,
    #[account(init,
    payer = signer,
    space = NullifierHash::SIZE,
    seeds = [NullifierHash::SEED.as_bytes().as_ref(), merkle.depth.to_le_bytes().as_ref(), args.nullifier_hash.as_slice()],
    bump
    )]
    pub nullifier_hash: Box<Account<'info, NullifierHash>>,
    pub token_program: Program<'info, Token>,
    pub mint: Box<Account<'info, Mint>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn withdraw(ctx: Context<WithdrawContext>, args: WithdrawArgs) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let merkle = &mut ctx.accounts.merkle;
    let token_program = &ctx.accounts.token_program;
    let recipient_token_account = &ctx.accounts.recipient_token_account;
    let merkle_token_account = &ctx.accounts.merkle_token_account;
    let mint = &ctx.accounts.mint;
    let recipient = &ctx.accounts.recipient;
    let m = merkle.to_merkle_tree();

    require!(m.known_root(&args.root), ErrorCodes::MerkleErrorUnknownRoot);
    require_keys_neq!(
        *signer.key,
        recipient.key(),
        ErrorCodes::SignerCantMatchRecipient
    );
    let proof = args.proof;
    let public_input = [recipient.key.to_bytes(), args.nullifier_hash];
    let proof_a: G1 = G1::deserialize_with_mode(
        &*[&change_endianness(&proof[0..64]), &[0u8][..]].concat(),
        Compress::No,
        Validate::Yes,
    )
    .map_err(|_| ErrorCodes::DeserializeWithMode)?;
    let mut proof_a_neg = [0u8; 65];
    proof_a
        .neg()
        .x
        .serialize_with_mode(&mut proof_a_neg[..32], Compress::No)
        .map_err(|_| ErrorCodes::SerializeWithMode)?;
    proof_a
        .neg()
        .y
        .serialize_with_mode(&mut proof_a_neg[32..], Compress::No)
        .map_err(|_| ErrorCodes::SerializeWithMode)?;
    let proof_a = change_endianness(&proof_a_neg[..64])
        .try_into()
        .map_err(|_| ErrorCodes::ExtractProofA)?;
    let proof_b = proof[64..192]
        .try_into()
        .map_err(|_| ErrorCodes::ExtractProofB)?;
    let proof_c = proof[192..256]
        .try_into()
        .map_err(|_| ErrorCodes::ExtractProofC)?;
    let mut verifier = if merkle.depth == 3 {
        Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_input, &VERIFYINGKEY3)
            .map_err(|_| ErrorCodes::Groth16CreateError)?
    } else if merkle.depth == 20 {
        Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_input, &VERIFYINGKEY20)
            .map_err(|_| ErrorCodes::Groth16CreateError)?
    } else {
        return Err(ErrorCodes::InvalidMerkleDepth.into());
    };
    verifier
        .verify()
        .map_err(|_| ErrorCodes::Groth16VerifyError)?;
    if is_native(&mint.to_account_info()) {
        transfer_sol_from_pda(
            &mut merkle.to_account_info(),
            &mut recipient.to_account_info(),
            merkle.deposit_size,
        )?;
    } else {
        let binding = merkle.depth.to_le_bytes();
        let seeds = [
            MerkleState::SEED.as_bytes().as_ref(),
            binding.as_ref(),
            &[merkle.bump],
        ];
        transfer_token_pda(
            merkle_token_account.to_account_info(),
            recipient_token_account.to_account_info(),
            token_program.to_account_info(),
            merkle.to_account_info(),
            merkle.deposit_size,
            &[seeds.as_slice()],
        )?;
        //
    }

    merkle.number_of_deposits -= 1;
    Ok(())
}
