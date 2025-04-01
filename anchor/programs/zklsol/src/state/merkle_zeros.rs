use crate::state::merkle_node::MerkleNode;
use anchor_lang::prelude::*;

#[account]
pub struct MerkleZeros {
    pub bump: u8,
    #[allow(dead_code)]
    pub depth: u8,
    pub zeros: Vec<[u8; 32]>,
}

impl MerkleZeros {
    pub const SEED: &'static str = "MerkleZeros";
    pub const SIZE: usize =
        // bump
        1 +
        // zeros
        4 + 32 * 32 +
        // padding
        100;

    pub fn new(depth: u8, bump: u8) -> Self {
        let data = "ZKL$SOL".as_bytes();
        let leaf = MerkleNode::hash(&data);
        let mut zeros: Vec<[u8; 32]> = Vec::new();
        let mut current_node = leaf.clone();
        for i in 0..depth {
            let level;
            if i == 0 {
                level = MerkleNode::deserialize(&current_node.hash);
                zeros.push(level.hash);
            } else {
                level = MerkleNode::from_children(&current_node, &current_node);
                zeros.push(level.hash);
            }
            current_node = level;
        }
        Self { depth, zeros, bump }
    }

    pub fn get(&self, level: u8) -> [u8; 32] {
        self.zeros[level as usize]
    }
}
