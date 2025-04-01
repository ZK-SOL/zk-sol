pragma circom 2.0.0;
include "circomlib/bitify.circom";         // For Num2Bits
include "circomlib/poseidon.circom";
include "ed25519-circom-circuits/scalarmul.circom";

// Circuit to verify knowledge of a preimage for a given hash
template VerifyPreimage() {
    signal input nullifer;
    signal input secret;
    signal input hash;
    signal input recipient; // not taking part in any computations
    signal output onullifer; // poseidon hash
    signal input witness[4][3];       // Witness point in projective coordinates (X, Y, Z, T)
    signal input accumulator[4][3];   // Accumulator point in projective coordinates
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

    // Decompose hash into 255 bits
    component hashBits = Num2Bits(255);
    hashBits.in <== hash;
    // Verify accumulator membership: [hash] * witness = accumulator
    component scalarmul = ScalarMul();
    for (var i = 0; i < 255; i++) {
        scalarmul.s[i] <== hashBits.out[i];    // Scalar as bit array
    }
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 3; j++) {
            scalarmul.P[i][j] <== witness[i][j];    // Witness point
        }
    }
    // Enforce equality with accumulator
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 3; j++) {
            scalarmul.sP[i][j] === accumulator[i][j];    // Result matches accumulator
        }
    }
}

component main = VerifyPreimage();