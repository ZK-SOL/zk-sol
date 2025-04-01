#!/bin/bash
# Exit on any error
set -e

export NAME="${1}"

if [ -z "${NAME}" ] ; then
  echo "Provide input file"
  exit 1
fi

export RAND_1=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)
export RAND_2=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)
export RAND_3=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)
export RAND_4=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)
export OUTPUT_DIR="circuits-output/${NAME}"
export RS_OUTPUT_DIR="circuits-output/${NAME}_rs/"

if [ ! -e "${OUTPUT_DIR}/${NAME}.r1cs" ] ; then
  echo "Can't find file ${OUTPUT_DIR}/${NAME}.r1cs"
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${RS_OUTPUT_DIR}"


snarkjs powersoftau new bn128 12 "${OUTPUT_DIR}/pot12_0000.ptau" -v
snarkjs powersoftau contribute "${OUTPUT_DIR}/pot12_0000.ptau" "${OUTPUT_DIR}/pot12_0001.ptau" --name="First contribution" -v  -e="${RAND_1}"
snarkjs powersoftau contribute "${OUTPUT_DIR}/pot12_0001.ptau" "${OUTPUT_DIR}/pot12_0002.ptau" --name="Second contribution" -v  -e="${RAND_2}"
snarkjs powersoftau prepare phase2 "${OUTPUT_DIR}/pot12_0002.ptau" "${OUTPUT_DIR}/pot12_final.ptau" -v
snarkjs groth16 setup "${OUTPUT_DIR}/${NAME}.r1cs" "${OUTPUT_DIR}/pot12_final.ptau" "${OUTPUT_DIR}/${NAME}_0000.zkey"
snarkjs zkey contribute "${OUTPUT_DIR}/${NAME}_0000.zkey" "${OUTPUT_DIR}/${NAME}_0001.zkey" --name="First contribution" -v -e="${RAND_3}"
snarkjs zkey contribute "${OUTPUT_DIR}/${NAME}_0001.zkey" "${OUTPUT_DIR}/${NAME}_0002.zkey" --name="Second contribution" -v -e="${RAND_4}"
snarkjs zkey export verificationkey "${OUTPUT_DIR}/${NAME}_0002.zkey" "${OUTPUT_DIR}/vk_${NAME}.json" -v
rm -f "${OUTPUT_DIR}/pot12_0001.ptau" "${OUTPUT_DIR}/pot12_0002.ptau" "${OUTPUT_DIR}/pot12_0000.ptau" "${OUTPUT_DIR}/pot12_final.ptau"
rm -f "${OUTPUT_DIR}${NAME}_0000.zkey" "${OUTPUT_DIR}/${NAME}_0001.zkey"

## Generate the .rs file
node scripts/vk-to-rs.js "${OUTPUT_DIR}/vk_${NAME}.json" "${RS_OUTPUT_DIR}"

echo "Done!"