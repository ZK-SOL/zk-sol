#!/bin/bash
#cargo build -p wasm-sol-accumulator --target wasm32-unknown-unknown --release
#wasm-bindgen --out-dir ./solita/wasm_sol_accumulator --target nodejs --typescript ./target/wasm32-unknown-unknown/release/wasm_sol_accumulator.wasm

cargo build -p zklsol --features wasm --target wasm32-unknown-unknown --release
wasm-bindgen --out-dir ./solita/wasm-zklsol --target nodejs --typescript ./target/wasm32-unknown-unknown/release/zklsol.wasm
