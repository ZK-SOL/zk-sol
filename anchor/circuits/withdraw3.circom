pragma circom 2.0.0;
include "./withdraw.circom";
// 3 levels of the merkle tree (root not counted)
component main = Withdraw(2);