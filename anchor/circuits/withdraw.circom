pragma circom 2.0.0;
include "./circomlib/poseidon.circom";
include "./circomlib/bitify.circom";
include "./merkleTree.circom";
include "./commitment-hasher.circom";
include "./nullifier-hasher.circom";

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels) {
    signal input root;
    signal input commitment;
    signal input nullifierHash;
    signal input recipient; // not taking part in any computations
    signal input nullifier;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output recipientOut;
    signal output nullifierHashOut;

    component commitmentHasher = CommitmentHasher();
    commitmentHasher.nullifier <== nullifier;
    commitmentHasher.secret <== secret;
    commitmentHasher.commitment === commitment;

    component nullifierHasher = NullifierHasher();
    nullifierHasher.nullifier <== nullifier;
    nullifierHasher.nullifierHash === nullifierHash;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHasher.commitment;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // Add hidden signals to make sure that tampering with recipient or fee will invalidate the snark proof
    // Most likely it is not required, but it's better to stay on the safe side and it only takes 2 constraints
    // Squares are used to prevent optimizer from removing those constraints
    signal recipientSquare;
    recipientSquare <== recipient * recipient;
    recipientOut <== recipient;
    nullifierHashOut <== nullifierHash;
}