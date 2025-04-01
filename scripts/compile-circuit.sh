#!/bin/bash
set -e
export NAME="${1}"

if [ -z "${NAME}" ] ; then
  echo "Provide input file"
  exit 1
fi

export OUTPUT_DIR="circuits-output/${NAME}"

if [ ! -e "circuits/${NAME}.circom" ] ; then
  echo "Can't find file ${OUTPUT_DIR}/${NAME}.r1cs"
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"


circom "circuits/${NAME}.circom" --c --json --r1cs --wasm --sym --output "${OUTPUT_DIR}/"