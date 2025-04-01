#!/usr/bin/env bash
# Exit on any error
set -e

export NAME="${1}"
export SIZE="${2}"

if [ -z "${NAME}" ] ; then
  echo "Provide input file"
  exit 1
fi

if [ -z "${SIZE}" ] ; then
  echo "Provide size"
  exit 1
fi

# shellcheck disable=SC2155
export RAND_1="$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)"
# shellcheck disable=SC2155
export RAND_2="$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)"
export OUTPUT_DIR="circuits-output/${NAME}"
export INPUT_DIR="circuits-output/${NAME}"
export RS_OUTPUT_DIR="circuits-output/${NAME}_rs/"

if [ ! -e "${INPUT_DIR}/${NAME}.r1cs" ] ; then
  echo "Can't find file ${INPUT_DIR}/${NAME}.r1cs"
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${RS_OUTPUT_DIR}"

echo 'prepare phase1'
snarkjs powersoftau new bn128 "${SIZE}"  "${OUTPUT_DIR}/pot12_0000.ptau" -v
echo 'contribute phase1 first'
snarkjs powersoftau contribute "${OUTPUT_DIR}/pot12_0000.ptau" "${OUTPUT_DIR}/pot12_0001.ptau" --name="First contribution" -v -e="random text"
echo 'apply a random beacon'
snarkjs powersoftau beacon  "${OUTPUT_DIR}/pot12_0001.ptau" "${OUTPUT_DIR}/pot12_beacon.ptau" 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"
echo 'prepare phase2'
snarkjs powersoftau prepare phase2 "${OUTPUT_DIR}/pot12_beacon.ptau" "${OUTPUT_DIR}/pot12_final.ptau" -v
echo 'Verify the final ptau'
snarkjs powersoftau verify "${OUTPUT_DIR}/pot12_final.ptau"
echo 'Generate zkey'
snarkjs zkey new "${INPUT_DIR}/${NAME}.r1cs" "${OUTPUT_DIR}/pot12_final.ptau"  "${OUTPUT_DIR}/${NAME}_0000.zkey"
echo "${RAND_1}" | \
snarkjs zkey contribute "${OUTPUT_DIR}/${NAME}_0000.zkey" "${OUTPUT_DIR}/${NAME}_final.zkey" --name="1st Contributor" -v -e="${RAND_2}"
snarkjs zkey export verificationkey  "${OUTPUT_DIR}/${NAME}_final.zkey" "${OUTPUT_DIR}/verification_key.json"

npx tsx scripts/parse-vk-to-rust.ts  "${OUTPUT_DIR}/verification_key.json"
mv verifying_key.rs "${RS_OUTPUT_DIR}/${NAME}_verifying_key.rs"
cp "${RS_OUTPUT_DIR}/${NAME}_verifying_key.rs" programs/zklsol/src