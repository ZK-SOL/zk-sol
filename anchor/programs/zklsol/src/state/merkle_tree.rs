use crate::error::ErrorCodes;
use crate::state::merkle_node::MerkleNode;
use crate::state::merkle_proof::{MerkleProof, PathElement};
use crate::state::merkle_zeros::MerkleZeros;
use crate::utils::number_array_to_bigint;
use anchor_lang::solana_program::compute_units::sol_remaining_compute_units;
use anchor_lang::solana_program::log::sol_log;
use std::collections::BTreeMap;

const ROOT_HISTORY_SIZE: u8 = 32;

pub struct MerkleTree {
    pub depth: u8,
    pub current_root_index: u8,
    pub next_index: u64,
    pub roots: BTreeMap<u8, MerkleNode>,
    pub filled_sub_trees: BTreeMap<u8, MerkleNode>,
    pub number_of_leaves: u64,
}

pub struct FromBytesMerkleTree {
    pub depth: u8,
    pub current_root_index: u8,
    pub next_index: u64,
    pub roots: Vec<[u8; 32]>,
    pub filled_sub_trees: Vec<[u8; 32]>,
}

impl MerkleTree {
    pub fn known_root(&self, root: &[u8; 32]) -> bool {
        self.roots.iter().any(|i| i.1.hash == *root)
    }

    pub fn parent_index(i: usize, height: usize) -> Option<usize> {
        // Total nodes in the tree: 2^(H+1) - 1
        let total_nodes = 2usize.pow((height + 1usize) as u32) - 1;
        // Root index: 2^(H+1) - 2
        let root_index = total_nodes - 1;

        // If i is the root, it has no parent
        if i == root_index {
            return None;
        }
        // Check if i is a valid index
        if i >= total_nodes {
            panic!(
                "Index {} exceeds total nodes {} for height {}",
                i, total_nodes, height
            );
        }

        // Calculate the level L of node i
        // L = floor(log2(i + 2^H)) - H
        let leaf_start = 2usize.pow(height as u32); // 2^H, start of leaf level
        let level = (usize::ilog2(i + leaf_start) as usize) - height;
        // Calculate parent index
        // p = (2^(H+1) - 2^(H-L)) + floor((i - (2^(H+1) - 2^(H-L+1))) / 2)
        let nodes_up_to_next_level =
            2usize.pow((height + 1) as u32) - 2usize.pow((height - level) as u32);
        let nodes_up_to_current_level =
            2usize.pow((height + 1) as u32) - 2usize.pow((height - level + 1) as u32);
        let offset = i - nodes_up_to_current_level;
        let parent = nodes_up_to_next_level + (offset / 2);
        Some(parent)
    }

    pub fn deserialize(bytes: FromBytesMerkleTree) -> Self {
        let mut roots: BTreeMap<u8, MerkleNode> = BTreeMap::new();
        for r in bytes.roots.iter().enumerate() {
            roots.insert(r.0 as u8, MerkleNode::deserialize(r.1));
        }
        let mut filled_sub_trees: BTreeMap<u8, MerkleNode> = BTreeMap::new();
        for r in bytes.filled_sub_trees.iter().enumerate() {
            filled_sub_trees.insert(r.0 as u8, MerkleNode::deserialize(r.1));
        }
        let number_of_leaves = 2u64.pow((bytes.depth - 1) as u32) - 1;
        Self {
            number_of_leaves,
            roots,
            filled_sub_trees,
            current_root_index: bytes.current_root_index,
            next_index: bytes.next_index,
            depth: bytes.depth,
        }
    }

    /// Since the tree is of fixed depth, and initially all leafs are zero.
    /// We can populate the filled sub-trees with zeros from pre-calculated values
    pub fn new(depth: u8, zeros: &MerkleZeros) -> Result<Self, ErrorCodes> {
        let number_of_leaves = 2u64.pow((depth - 1) as u32) - 1;
        if depth > 32 {
            return Err(ErrorCodes::MerkleErrorTooLarge);
        }
        let mut filled_sub_trees: BTreeMap<u8, MerkleNode> = BTreeMap::new();
        let mut roots: BTreeMap<u8, MerkleNode> = BTreeMap::new();
        for i in 0..depth {
            let node = MerkleNode::deserialize(&zeros.get(i));
            filled_sub_trees.insert(i, node.clone());
        }
        let root = MerkleNode::deserialize(&zeros.get(depth - 1));
        roots.insert(0, root);
        Ok(MerkleTree {
            number_of_leaves,
            roots,
            depth,
            current_root_index: 0,
            next_index: 0,
            filled_sub_trees,
        })
    }

    /// Left nodes are always even and right nodes are always odd.
    /// If we're at an even index, to the right we will
    /// always have an empty node we can take from our cache.
    /// If we're at an odd index, to the left there will always be a node we already hashed.
    /// We go up a level by dividing by 2.
    pub fn insert(
        &mut self,
        data: &[u8; 32],
        zeros: &MerkleZeros,
    ) -> Result<MerkleProof, ErrorCodes> {
        if self.next_index > self.number_of_leaves {
            return Err(ErrorCodes::MerkleErrorFull);
        }
        let mut current_index = self.next_index;
        let mut absolute_current_index = self.next_index;
        let mut current_level_node = MerkleNode::deserialize(data);
        let mut left: MerkleNode;
        let mut right: MerkleNode;
        let mut proof: MerkleProof = MerkleProof::new();

        for i in 0..self.depth - 1 {
            if current_index % 2 == 0 {
                left = current_level_node.clone();
                right = MerkleNode::deserialize(&zeros.get(i));
                self.filled_sub_trees.insert(i, current_level_node.clone());
            } else {
                left = self.filled_sub_trees.get(&i).unwrap().clone();
                right = current_level_node.clone();
            }
            current_level_node = MerkleNode::from_children(&left, &right);
            if absolute_current_index % 2 == 0 {
                proof.push(PathElement::new(absolute_current_index, &left));
                proof.push(PathElement::new(absolute_current_index + 1, &right));
            } else {
                proof.push(PathElement::new(absolute_current_index - 1, &left));
                proof.push(PathElement::new(absolute_current_index, &right));
            }

            if let Some(parent) =
                Self::parent_index(absolute_current_index as usize, (self.depth - 1) as usize)
            {
                absolute_current_index = parent as u64;
            }
            current_index = current_index / 2;
        }
        proof.push(PathElement::new(
            absolute_current_index,
            &current_level_node,
        ));
        self.current_root_index = (self.current_root_index + 1) % ROOT_HISTORY_SIZE;
        self.roots
            .insert(self.current_root_index, current_level_node);
        self.next_index += 1;
        Ok(proof)
    }

    pub fn generate_proof_path(&self, leaf_index: u64) -> Vec<Vec<u64>> {
        let total_nodes = 2u64.pow(self.depth as u32) - 2;
        let mut path: Vec<Vec<u64>> = Vec::with_capacity(self.depth as usize);
        let mut absolute_current_index = leaf_index;
        for _ in 0..self.depth {
            let is_left = absolute_current_index % 2 == 0;
            let sibling_index = if is_left {
                absolute_current_index + 1
            } else {
                absolute_current_index - 1
            };
            if absolute_current_index >= total_nodes {
                path.push(vec![absolute_current_index]);
            } else if absolute_current_index % 2 == 0 {
                path.push(vec![absolute_current_index, sibling_index, 0]);
            } else {
                path.push(vec![sibling_index, absolute_current_index, 1]);
            }
            if let Some(parent) =
                Self::parent_index(absolute_current_index as usize, (self.depth - 1) as usize)
            {
                absolute_current_index = parent as u64;
            }
        }
        path
    }

    pub fn roots_as_vec(&self) -> Vec<[u8; 32]> {
        let mut output: Vec<[u8; 32]> = Vec::with_capacity(32);
        let mut keys: Vec<u8> = self.roots.keys().copied().collect();
        keys.sort();
        for k in keys {
            output.push(self.roots.get(&k).unwrap().hash);
        }
        output
    }

    pub fn filled_sub_trees_as_vec(&self) -> Vec<[u8; 32]> {
        let mut output: Vec<[u8; 32]> = Vec::with_capacity(32);
        let mut keys: Vec<u8> = self.filled_sub_trees.keys().copied().collect();
        keys.sort();
        for k in keys {
            output.push(self.filled_sub_trees.get(&k).unwrap().hash);
        }
        output
    }
}

#[cfg(test)]
mod tests {
    use crate::state::merkle_node::MerkleNode;
    use crate::state::merkle_tree::MerkleTree;
    use crate::state::merkle_zeros::MerkleZeros;
    use sha2::{Digest, Sha256};
    use std::collections::HashMap;

    #[test]
    fn add_nodes_test() {
        let zeros = MerkleZeros::new(5, 0);
        let mut tree = MerkleTree::new(5, &zeros).unwrap();
        for i in 0..tree.number_of_leaves {
            let mut hasher = Sha256::new();
            let data = i.to_le_bytes();
            hasher.update(&data);
            let data = <[u8; 32]>::from(hasher.finalize());
            let _proof1 = tree.insert(&data, &zeros).unwrap();
            println!("proof1 = {:?}", _proof1);
            let _proof2 = tree.generate_proof_path(i);
        }
    }

    #[test]
    fn init_tree_test() {
        let depth = 32;
        let zeros = MerkleZeros::new(depth, 0);
        let root = MerkleNode::deserialize(&zeros.get(depth - 1));
        let m = MerkleTree::new(depth, &zeros).unwrap();
        let r = m.roots.get(&0).unwrap().clone();
        println!("r = {:?}", r);
        assert_eq!(root, r);
        let v = m.roots_as_vec();
        assert_eq!(root.hash, v[0]);
    }

    #[test]
    fn cache_generation_test() {
        let data = "ZKL$SOL".as_bytes();
        let leaf = MerkleNode::hash(&data);
        let depth = 5;
        let mut levels: HashMap<u64, MerkleNode> = HashMap::new();
        let mut current_node = leaf.clone();
        for i in 0..depth {
            let level = MerkleNode::from_children(&current_node, &current_node);
            if i == 0 {
                levels.insert(i, leaf.clone());
            } else {
                levels.insert(i, level.clone());
            }
            current_node = level;
        }
        let mut keys: Vec<u64> = levels.keys().copied().collect();
        keys.sort();
        for i in keys {
            if i == 0 {
                println!("if level == {} {{ {:?} ", i, levels.get(&i).unwrap().hash);
            } else if i == depth - 1 {
                println!("}} else  {{ {:?} ", levels.get(&i).unwrap().hash);
            } else {
                println!(
                    "}} else if level == {} {{ {:?} ",
                    i,
                    levels.get(&i).unwrap().hash
                );
            }
        }
    }
}
