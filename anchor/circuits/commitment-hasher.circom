pragma circom 2.0.0;
include "./circomlib/poseidon.circom";
// computes Poseidon(nullifier + secret)
template CommitmentHasher() {
    signal input nullifier;
    signal input secret;
    signal output commitment;
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== nullifier;
    poseidon.inputs[1] <== secret;
    commitment <== poseidon.out;
}