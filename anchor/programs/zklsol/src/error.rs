use anchor_lang::prelude::*;

/// Error codes.
#[error_code]
pub enum ErrorCodes {
    #[msg("Numerical Overflow")]
    NumericalOverflow,
    #[msg("Account is not authorized to execute this instruction")]
    Unauthorized,
    #[msg("Token account owner did not match intended owner")]
    OwnerMismatch,
    #[msg("Bad math")]
    BadMath,
    #[msg("deserialize_uncompressed error")]
    DeserializeUncompressed,
    #[msg("serialize_uncompressed error")]
    SerializeUncompressed,
    #[msg("extract proof_a")]
    ExtractProofA,
    #[msg("extract proof_b")]
    ExtractProofB,
    #[msg("extract proof_c")]
    ExtractProofC,
    #[msg("Groth16Error Create error")]
    Groth16CreateError,
    #[msg("Groth16Error Verify error")]
    Groth16VerifyError,
    #[msg("deserialize_with_mode error")]
    DeserializeWithMode,
    #[msg("serialize_with_mode error")]
    SerializeWithMode,
    #[msg("failed to_ec_accumulator")]
    FailedToEcAccumulator,
    #[msg("Cannot create Merkle tree with empty leaves")]
    MerkleErrorEmptyLeaves,
    #[msg("Invalid depth for Merkle tree")]
    MerkleErrorInvalidDepth,
    #[msg("Invalid proof provided")]
    MerkleErrorInvalidProof,
    #[msg("Too Large")]
    MerkleErrorTooLarge,
    #[msg("Full")]
    MerkleErrorFull,
    #[msg("Unknown root")]
    MerkleErrorUnknownRoot,
    #[msg("Invalid Merkle depth")]
    InvalidMerkleDepth,
    #[msg("Cannot find Merkle node")]
    CantFindMerkleNode,
    #[msg("Serialize data")]
    SerializeData,
    #[msg("Invalid Lookup Table")]
    InvalidLookupTable,
    #[msg("Wrong PDA Address")]
    WrongPdaAddress,
    #[msg("Too Many Remaining Accounts")]
    TooManyRemainingAccounts,
    #[msg("Pending Proof Exists")]
    PendingProofExists,
    #[msg("Missing Pending Proof")]
    MissingPendingProof,
    #[msg("Not Lowest Pending Proof")]
    NotLowestPendingProof,
    #[msg("Account Data Too Small")]
    AccountDataTooSmall,
    #[msg("Signer Cant Match Recipient")]
    SignerCantMatchRecipient,
    #[msg("Value can't be Poseidon hashed")]
    ValueCantBePoseidonHashed,
}
