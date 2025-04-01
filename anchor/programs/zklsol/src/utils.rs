#![allow(dead_code)]
#![allow(unused_variables)]

use crate::error::ErrorCodes;
use crate::state::merkle_state::MerkleNodeState;
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::log::sol_log;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_lang::solana_program::program_memory::sol_memset;
use anchor_spl::associated_token::get_associated_token_address;
use anchor_spl::token::spl_token;
use num_bigint::BigInt;
use sha2::{Digest, Sha256};
use std::cell::RefCell;
use std::rc::Rc;

pub fn number_array_to_bigint(arr: &[u8], reverse: bool) -> BigInt {
    let array = if reverse {
        let mut reversed = arr.to_vec();
        reversed.reverse();
        reversed
    } else {
        arr.to_vec()
    };

    array
        .iter()
        .fold(BigInt::from(0), |acc, &num| (acc << 8) | BigInt::from(num))
}

pub fn vec_to_array(vec: &[u8]) -> [u8; 32] {
    let mut array = [0u8; 32]; // Initialize with zeros
    let len = vec.len().min(32); // Use the minimum of 32 or vector length
    array[..len].copy_from_slice(&vec[..len]);
    array
}

pub fn assert_ata(ata: &Pubkey, owner: &Pubkey, mint: &Pubkey) -> Result<()> {
    let real_ata = get_associated_token_address(owner, mint);
    require_keys_eq!(*ata, real_ata, ErrorCodes::OwnerMismatch);
    Ok(())
}

pub fn transfer_sol<'a>(
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    amount: u64,
) -> Result<()> {
    solana_program::program::invoke(
        &solana_program::system_instruction::transfer(&from.key(), &to.key(), amount),
        &[from, to, system_program],
    )?;
    Ok(())
}

pub fn transfer_token<'a>(
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    owner: AccountInfo<'a>,
    amount: u64,
) -> Result<()> {
    solana_program::program::invoke(
        &spl_token::instruction::transfer(
            &token_program.key(),
            &from.key(),
            &to.key(),
            &owner.key(),
            &[],
            amount,
        )?,
        &[from, to, token_program, owner],
    )?;
    Ok(())
}

pub fn transfer_token_pda<'a>(
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    owner: AccountInfo<'a>,
    amount: u64,
    seeds: &[&[&[u8]]],
) -> Result<()> {
    solana_program::program::invoke_signed(
        &spl_token::instruction::transfer(
            &token_program.key(),
            &from.key(),
            &to.key(),
            &owner.key(),
            &[],
            amount,
        )?,
        &[from, to, token_program, owner],
        seeds,
    )?;
    Ok(())
}

pub fn close_account(from: &mut AccountInfo, to: &mut AccountInfo) -> Result<()> {
    let amount = from.lamports();
    let size = from.try_data_len()?;
    transfer_sol_from_pda(from, to, amount)?;
    sol_memset(&mut from.try_borrow_mut_data()?, 0, size);
    Ok(())
}

pub fn burn_tokens<'a>(
    token_program: AccountInfo<'a>,
    account: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    amount: u64,
    seeds: &[&[&[u8]]],
) -> Result<()> {
    let ix = spl_token::instruction::burn(
        token_program.key,
        account.key,
        mint.key,
        authority.key,
        &[&authority.key],
        amount,
    )?;
    solana_program::program::invoke_signed(&ix, &[account, mint, authority, token_program], seeds)?;
    Ok(())
}

pub fn close_token_account<'a>(
    account: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    seeds: &[&[&[u8]]],
) -> Result<()> {
    let ix = spl_token::instruction::close_account(
        &spl_token::ID,
        account.key,
        destination.key,
        authority.key,
        &[],
    )?;
    solana_program::program::invoke_signed(&ix, &[account, destination, authority], seeds)?;
    Ok(())
}

pub fn transfer_sol_from_pda(
    from: &mut AccountInfo,
    to: &mut AccountInfo,
    amount: u64,
) -> Result<()> {
    let post_from = from
        .lamports()
        .checked_sub(amount)
        .ok_or(ErrorCodes::NumericalOverflow)?;
    let post_to = to
        .lamports()
        .checked_add(amount)
        .ok_or(ErrorCodes::NumericalOverflow)?;

    **from.try_borrow_mut_lamports().unwrap() = post_from;
    **to.try_borrow_mut_lamports().unwrap() = post_to;
    Ok(())
}

pub fn print_sol(name: &str, value: u64) {
    sol_log(&format!(
        "{} = {}",
        name,
        value as f64 / LAMPORTS_PER_SOL as f64
    ));
}

pub fn change_endianness(bytes: &[u8]) -> Vec<u8> {
    let mut vec = Vec::new();
    for b in bytes.chunks(32) {
        for byte in b.iter().rev() {
            vec.push(*byte);
        }
    }
    vec
}

pub fn clone_account_info<'a>(original: &AccountInfo<'a>) -> AccountInfo<'static> {
    // Clone and leak the data
    let new_data_vec = original.data.borrow().to_vec();
    let new_data_slice = Box::leak(Box::new(new_data_vec)).as_mut_slice();
    let new_data_rc = Rc::new(RefCell::new(new_data_slice));

    // Clone and leak the lamports
    let new_lamports = **original.lamports.borrow();
    let new_lamports_ptr = Box::leak(Box::new(new_lamports));
    let new_lamports_rc = Rc::new(RefCell::new(new_lamports_ptr));

    // Clone and leak the key and owner to make them 'static
    let new_key = Box::leak(Box::new(*original.key));
    let new_owner = Box::leak(Box::new(*original.owner));

    // Return an AccountInfo with all 'static references
    AccountInfo {
        key: new_key,              // 'static
        lamports: new_lamports_rc, // 'static
        data: new_data_rc,         // 'static
        owner: new_owner,          // 'static
        rent_epoch: original.rent_epoch,
        is_signer: original.is_signer,
        is_writable: original.is_writable,
        executable: original.executable,
    }
}

pub fn unsafe_clone_account_info<'a, 'info>(input: &'a AccountInfo<'info>) -> AccountInfo<'static> {
    unsafe { std::mem::transmute::<AccountInfo, AccountInfo>(input.clone()) }
}

#[inline(always)]
pub fn create_pda_account<'a, 'info>(
    target_account: &'a AccountInfo<'info>,
    system_program: &'a AccountInfo<'info>,
    payer: &'a AccountInfo<'info>,
    space: usize,
    program_id: &Pubkey,
    seeds: &[&[u8]],
) -> Result<()> {
    let (expected_pda, bump) = Pubkey::find_program_address(seeds, program_id);
    require_keys_eq!(
        *target_account.key,
        expected_pda,
        ErrorCodes::WrongPdaAddress
    );
    let bump: &[u8] = &[bump];
    let mut combined_seeds = Vec::with_capacity(seeds.len() + 1);
    combined_seeds.extend_from_slice(seeds);
    combined_seeds.push(bump);
    let seeds = combined_seeds.as_slice();

    let lamports = Rent::get()?.minimum_balance(space);
    let ix = solana_program::system_instruction::create_account(
        payer.key,
        target_account.key,
        lamports,
        space as u64,
        program_id,
    );

    solana_program::program::invoke_signed(
        &ix,
        &[
            payer.clone(),
            target_account.clone(),
            system_program.clone(),
        ],
        &[seeds],
    )?;
    Ok(())
}

pub fn is_native(token_mint: &AccountInfo) -> bool {
    token_mint.key() == spl_token::native_mint::id()
}

pub fn derive_discriminator(name: &str) -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(name.as_bytes());
    let result = hasher.finalize();
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&result[..8]);
    discriminator
}
