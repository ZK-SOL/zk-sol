pragma circom 2.0.0;
include "circomlib/poseidon.circom";

// Circuit to verify knowledge of a preimage for a given hash
template VerifyPreimage() {
    signal input nullifer;
    signal input secret;
    signal input hash;
    signal input recipient; // not taking part in any computations
    signal output onullifer; // poseidon hash
    signal output phash;
    signal recipientSquare;

    recipientSquare <== recipient * recipient;
    recipientSquare + 0 === recipientSquare;
    // Compute the hash of the preimage using Poseidon
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== nullifer;
    poseidon.inputs[1] <== secret;
    // Constraint: the computed hash must equal the provided hash
    poseidon.out === hash;
    // Output
    onullifer <== nullifer;
    phash <== poseidon.out;
}

component main = VerifyPreimage();