pragma circom 2.0.0;
include "./circomlib/poseidon.circom";
// computes Poseidon(nullifier)
template NullifierHasher() {
    signal input nullifier;
    signal output nullifierHash;
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== nullifier;
    nullifierHash <== poseidon.out;
}