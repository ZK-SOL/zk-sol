use anchor_lang::solana_program::poseidon::{hashv, Endianness, Parameters};
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use ark_bn254::Fr;
use ark_ff::PrimeField;
use ark_serialize::CanonicalSerialize;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Debug, Clone, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct MerkleNode {
    pub hash: [u8; 32],
}

impl MerkleNode {
    pub const SIZE: usize = 32;
    pub fn mod_input(input: &[u8]) -> [u8; 32] {
        // First create a 32-byte array from input
        let mut data = [0u8; 32];
        let len = input.len().min(32);
        data[..len].copy_from_slice(&input[..len]);

        // Reverse bytes for big-endian input
        data.reverse();

        // Convert to Fr using little-endian bytes (ark-ff uses LE internally)
        let fr = Fr::from_le_bytes_mod_order(&data);

        // Convert back to bytes
        let mut modded_bytes = Vec::new();
        fr.serialize_uncompressed(&mut modded_bytes).unwrap();

        // Ensure we have 32 bytes
        let mut result = [0u8; 32];
        result[..modded_bytes.len().min(32)]
            .copy_from_slice(&modded_bytes[..modded_bytes.len().min(32)]);

        // Reverse back to big-endian
        result.reverse();
        result
    }

    pub fn deserialize(data: &[u8]) -> Self {
        Self {
            hash: Self::mod_input(data),
        }
    }

    pub fn hash(data: &[u8]) -> Self {
        let data = Self::mod_input(data);
        let hash = hashv(Parameters::Bn254X5, Endianness::BigEndian, &[&data]).unwrap();
        Self { hash: hash.0 }
    }

    pub fn from_children(left: &MerkleNode, right: &MerkleNode) -> Self {
        let left_data = Self::mod_input(&left.hash);
        let right_data = Self::mod_input(&right.hash);

        let hash = hashv(
            Parameters::Bn254X5,
            Endianness::BigEndian,
            &[&left_data, &right_data],
        )
        .unwrap();
        Self { hash: hash.0 }
    }
}
