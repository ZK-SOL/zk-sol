use crate::state::merkle_node::MerkleNode;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};

/// PathElement matching circom circuit
/// The path contains each sibling node, their index and if they are left or right
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PathElement {
    pub index: u64,
    pub node: MerkleNode,
}

impl PathElement {
    pub const SIZE: usize =
        // index
        8 +
        // node
        MerkleNode::SIZE;
    pub fn new(index: u64, node: &MerkleNode) -> Self {
        Self {
            index,
            node: node.clone(),
        }
    }
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MerkleProof {
    pub path: Vec<PathElement>,
}

impl MerkleProof {
    pub const SIZE: usize = 4 + 2 * 20 * PathElement::SIZE;

    pub fn new() -> Self {
        Self { path: vec![] }
    }

    pub fn push(&mut self, sibling: PathElement) {
        self.path.push(sibling);
    }
}
