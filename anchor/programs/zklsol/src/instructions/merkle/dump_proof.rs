use crate::error::ErrorCodes;
use crate::state::merkle_proof::PathElement;
use crate::state::merkle_state::{MerkleNodeState, MerklePendingProofState, MerkleState};
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use crate::utils::{close_account, derive_discriminator, unsafe_clone_account_info};
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::log::sol_log;
use anchor_spl::token::Mint;
use std::collections::HashMap;

#[derive(Accounts)]
pub struct DumpProof<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut,
    seeds = [MerkleState::SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref()],
    bump = merkle.bump
    )]
    pub merkle: Box<Account<'info, MerkleState>>,
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut,
    seeds = [MerklePendingProofState::SEED.as_bytes().as_ref(), mint.key().as_ref(), merkle.depth.to_le_bytes().as_ref(),  pending_proof.index.to_le_bytes().as_ref()],
    bump = pending_proof.bump
    )]
    pub pending_proof: Box<Account<'info, MerklePendingProofState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn dump_proof(ctx: Context<DumpProof>) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let merkle = &mut ctx.accounts.merkle;
    let pending_proof = &mut ctx.accounts.pending_proof;
    let system_program = &ctx.accounts.system_program;
    let program_id = ctx.program_id;
    require!(
        ctx.remaining_accounts.len() <= 5,
        ErrorCodes::TooManyRemainingAccounts
    );
    require_eq!(
        merkle.lowest_pending_proof_index,
        pending_proof.index,
        ErrorCodes::NotLowestPendingProof
    );
    let depth_binding = merkle.depth.to_le_bytes();
    let map: HashMap<Pubkey, PathElement> = pending_proof.generate_map(merkle.depth, program_id);
    let system_program_info: AccountInfo =
        unsafe_clone_account_info(&system_program.to_account_info());
    let signer_account_info = unsafe_clone_account_info(&signer.to_account_info());
    let mut accounts_infos: Vec<AccountInfo> = Vec::with_capacity(ctx.remaining_accounts.len());
    ctx.remaining_accounts.iter().for_each(|account| {
        let a = unsafe_clone_account_info(account);
        accounts_infos.push(a);
    });
    for account in accounts_infos {
        match &map.get(account.key) {
            Some(p) => {
                if let Some(path_index) = pending_proof
                    .proof
                    .path
                    .iter()
                    .position(|i| i.index == p.index)
                {
                    pending_proof.proof.path.remove(path_index);
                }
                let index_binding = p.index.to_le_bytes();
                let seeds = &[
                    MerkleNodeState::SEED.as_bytes(),
                    depth_binding.as_ref(),
                    index_binding.as_ref(),
                ];
                let (expected_pda, bump) = Pubkey::find_program_address(seeds, program_id);
                let bump_seeds = &[
                    MerkleNodeState::SEED.as_bytes(),
                    depth_binding.as_ref(),
                    index_binding.as_ref(),
                    &[bump],
                ];
                require_keys_eq!(*account.key, expected_pda, ErrorCodes::WrongPdaAddress);

                if account.data_is_empty() {
                    let ix = solana_program::system_instruction::create_account(
                        signer.key,
                        account.key,
                        Rent::get()?.minimum_balance(MerkleNodeState::SIZE),
                        MerkleNodeState::SIZE as u64,
                        program_id,
                    );
                    solana_program::program::invoke_signed(
                        &ix,
                        &[
                            signer_account_info.clone(),
                            account.clone(),
                            system_program_info.clone(),
                        ],
                        &[bump_seeds],
                    )?;
                }
                let existing_account = MerkleNodeState {
                    index: p.index,
                    data: p.node.hash,
                    bump,
                };
                let new_data_vec = existing_account.try_to_vec()?;
                sol_log(&format!(
                    "index = {} | p.node.hash= {:?}",
                    p.index, p.node.hash
                ));
                sol_log(&format!("new_data_vec = {:?}", new_data_vec));
                let mut account_data = account.data.borrow_mut();
                if account_data.len() < new_data_vec.len() {
                    msg!(
                        "Account data too small: {} < {}",
                        account_data.len(),
                        new_data_vec.len()
                    );
                    return Err(Error::from(ErrorCodes::AccountDataTooSmall));
                }
                let discriminator = derive_discriminator("MerkleNodeState");
                // Write the serialized data
                account_data[..discriminator.len()].copy_from_slice(&discriminator);
                account_data[discriminator.len()..discriminator.len() + new_data_vec.len()]
                    .copy_from_slice(&new_data_vec);
                // let new_data_slice = Box::leak(Box::new(new_data_vec)).as_mut_slice();
                // account.data.borrow_mut()[..new_data_slice.len()].copy_from_slice(new_data_slice);
            }
            None => {}
        }
    }
    if pending_proof.proof.path.is_empty() {
        msg!("Closing PendingProof {}", pending_proof.index);
        merkle.lowest_pending_proof_index += 1;
        close_account(
            &mut pending_proof.to_account_info(),
            &mut signer.to_account_info(),
        )?;
    }
    Ok(())
}
