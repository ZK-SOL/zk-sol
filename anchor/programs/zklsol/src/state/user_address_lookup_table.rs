use crate::state::merkle_node::MerkleNode;
use anchor_lang::prelude::*;

#[account]
pub struct UserAddressLookupTable {
    pub bump: u8,
    pub signer: Pubkey,
    pub address_lookup_table: Pubkey,
    pub accounts: Vec<Pubkey>,
}

impl UserAddressLookupTable {
    pub const SEED: &'static str = "UserAddressLookupTable";
    pub const SIZE: usize =
        // bump
        1 +
        // user
        32 +
        // address_lookup_table
        32 +
        // accounts
        4 + 32 * 32 +
        // padding
        100;
}
