#!/bin/bash
set -x
which circom
CIRCOM_STATUS=$?
if [ "${CIRCOM_STATUS}" != "0" ] ; then
  git clone https://github.com/iden3/circom.git \
  && \
  cd circom \
  && \
  cargo build --release \
  && \
  cargo install --path circom
fi

which snarkjs
SNARKJS_STATUS=$?
if [ "${SNARKJS_STATUS}" != "0" ] ; then
  npm install -g snarkjs@latest
  npm install --save @types/snarkjs
fi