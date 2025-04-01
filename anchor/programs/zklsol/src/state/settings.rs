use anchor_lang::prelude::*;
// https://www.rareskills.io/post/uniswap-v2-price-impact

#[account]
#[derive(Default)]
pub struct Settings {
    pub bump: u8,
    pub owner: Pubkey,
    pub fee: u64,
}

impl Settings {
    #[allow(dead_code)]
    pub const SIZE: usize = 8 + 32 + 64 + 64 + 500;

    #[allow(dead_code)]
    pub const SEED: &'static str = "Settings";
}
