use crate::state::merkle_state::{MerkleNodeState, MerkleState};
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMerkleNodeArgs {
    pub depth: u64,
    pub index: u64,
    pub data: [u8; 32],
}

#[derive(Accounts)]
#[instruction(args: CreateMerkleNodeArgs)]
pub struct CreateMerkleNode<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init,
    payer = signer,
    seeds = [MerkleNodeState::SEED.as_bytes().as_ref(), args.depth.to_le_bytes().as_ref(), args.index.to_le_bytes().as_ref()],
    space = MerkleNodeState::SIZE,
    bump
    )]
    pub merkle_node: Box<Account<'info, MerkleNodeState>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_merkle_node(
    ctx: Context<CreateMerkleNode>,
    args: CreateMerkleNodeArgs,
) -> Result<()> {
    let merkle_node = &mut ctx.accounts.merkle_node;
    merkle_node.bump = ctx.bumps.merkle_node;
    merkle_node.index = args.index;
    merkle_node.data = args.data;
    Ok(())
}
