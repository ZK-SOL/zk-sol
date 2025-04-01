use crate::state::merkle_node::MerkleNode;
use crate::state::merkle_tree::MerkleTree;
use crate::state::merkle_zeros::MerkleZeros;
use anchor_lang::solana_program::wasm_bindgen;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
#[derive(Debug)]
pub struct MerkleNodeWasm {
    hash: Vec<u8>,
}
#[wasm_bindgen]
impl MerkleNodeWasm {
    #[wasm_bindgen(constructor)]
    pub fn deserialize(data: Vec<u8>) -> Result<MerkleNodeWasm, JsValue> {
        if data.len() != 32 {
            return Err(JsValue::from_str("Hash must be 32 bytes"));
        }
        Ok(Self {
            hash: Self::mod_input(data),
        })
    }

    #[wasm_bindgen]
    pub fn mod_input(input: Vec<u8>) -> Vec<u8> {
        MerkleNode::mod_input(&input).to_vec()
    }

    #[wasm_bindgen]
    pub fn hash(data: Vec<u8>) -> Self {
        let node = MerkleNode::hash(&data);
        Self {
            hash: node.hash.to_vec(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn get_hash(&self) -> Vec<u8> {
        self.hash.clone()
    }

    #[wasm_bindgen]
    pub fn from_children(left: &MerkleNodeWasm, right: &MerkleNodeWasm) -> Self {
        let left_node = MerkleNode::deserialize(&left.hash);
        let right_node = MerkleNode::deserialize(&right.hash);
        let node = MerkleNode::from_children(&left_node, &right_node);
        Self {
            hash: node.hash.to_vec(),
        }
    }

    #[wasm_bindgen]
    pub fn generate_proof_path(depth: u8, leaf_index: u64) -> Result<JsValue, JsValue> {
        let zeros = MerkleZeros::new(depth, 0);
        let merkle = MerkleTree::new(depth, &zeros).unwrap();
        let proof_path = merkle.generate_proof_path(leaf_index);
        serde_wasm_bindgen::to_value(&proof_path).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
