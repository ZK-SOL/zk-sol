/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import { PathElement, pathElementBeet } from './PathElement'
export type MerkleProof = {
  path: PathElement[]
}

/**
 * @category userTypes
 * @category generated
 */
export const merkleProofBeet = new beet.FixableBeetArgsStruct<MerkleProof>(
  [['path', beet.array(pathElementBeet)]],
  'MerkleProof'
)
