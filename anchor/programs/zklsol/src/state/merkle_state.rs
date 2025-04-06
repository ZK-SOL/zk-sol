use crate::error::ErrorCodes;
use crate::state::merkle_proof::{MerkleProof, PathElement};
use crate::state::merkle_tree::{FromBytesMerkleTree, MerkleTree};
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::clock::Epoch;
use std::borrow::BorrowMut;
use std::collections::HashMap;

#[account]
pub struct MerkleState {
    pub bump: u8,
    pub depth: u64,
    pub deposit_size: u64,
    pub number_of_deposits: u64,
    pub current_root_index: u8,
    pub next_index: u64,
    pub lowest_pending_proof_index: u64,
    pub highest_pending_proof_index: u64,
    pub mint: Pubkey,
    pub roots: Vec<[u8; 32]>,
    pub filled_sub_trees: Vec<[u8; 32]>,
}

impl MerkleState {
    pub const SEED: &'static str = "Merkle";
    pub const TOKEN_SEED: &'static str = "MerkleToken";
    pub const SIZE: usize =
        // discriminator
        8 +
        // bump
        1 +
            // lowest_pending_proof_index
            8 +
            // highest_pending_proof_index
            8 +
            // roots
            30 * 32 + 4 +
            // depth
            8 +
            // current_root_index
            8 +
            // next_index
            8 +
            // filled_sub_trees
            32 * 32 + 4 +
            // padding
            100;

    pub fn to_merkle_tree(&self) -> MerkleTree {
        let bytes = FromBytesMerkleTree {
            roots: self.roots.to_vec(),
            current_root_index: self.current_root_index,
            filled_sub_trees: self.filled_sub_trees.to_vec(),
            depth: self.depth as u8,
            next_index: self.next_index,
        };
        MerkleTree::deserialize(bytes)
    }

    pub fn sync(&mut self, m: MerkleTree) {
        self.depth = m.depth as u64;
        self.current_root_index = m.current_root_index;
        self.next_index = m.next_index;
        self.roots = m.roots_as_vec();
        self.filled_sub_trees = m.filled_sub_trees_as_vec();
    }
}

#[account]
pub struct MerklePendingProofState {
    pub bump: u8,
    pub depth: u64,
    pub index: u64,
    pub mint: Pubkey,
    pub proof: MerkleProof,
}

impl MerklePendingProofState {
    pub const SEED: &'static str = "MerklePendingProof";
    pub const SIZE: usize =
        // discriminator
        8 +
    // bump
    1 +
    // index
    8 +
    // depth
    8 +
    // data
    32 +
    // owner
    32 +
    // mint
    32 +
    // proof path
    MerkleProof::SIZE;

    pub fn generate_map(&self, depth: u64, program_id: &Pubkey) -> HashMap<Pubkey, PathElement> {
        let depth_binding = depth.to_le_bytes();
        let mut map: HashMap<Pubkey, PathElement> = HashMap::new();
        for p in &self.proof.path {
            let index_binding = p.index.to_le_bytes();
            let seeds = &[
                MerkleNodeState::SEED.as_bytes(),
                depth_binding.as_ref(),
                index_binding.as_ref(),
            ];
            let (expected_pda, _bump) = Pubkey::find_program_address(seeds, program_id);
            map.insert(expected_pda, p.clone());
        }

        map
    }
}

#[account]
pub struct MerkleNodeState {
    pub bump: u8,
    pub index: u64,
    pub data: [u8; 32],
}

impl MerkleNodeState {
    pub const SEED: &'static str = "MerkleNode";
    pub const SIZE: usize =
        // discriminator
        8 +
        // bump
        1 +
        // index
        8 +
        // data
        32;
}

#[account]
pub struct NullifierHash {
    pub bump: u8,
    pub nullifier_hash: [u8; 32],
}

impl NullifierHash {
    pub const SEED: &'static str = "NullifierHash";
    pub const SIZE: usize =
        // discriminator
        8 +
        // bump
        1 +
        // nullifier_hash
        32;
}
