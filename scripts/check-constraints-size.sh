#!/usr/bin/env bash
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

snarkjs r1cs info "${OUTPUT_DIR}/${NAME}.r1cs"