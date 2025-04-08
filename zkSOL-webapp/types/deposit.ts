// Define the deposit state type
export interface DepositStateType {
  secret?: number;
  nullifier?: number;
  amount?: number;
  showProof?: boolean;
  index?: number;
  proofData?: {
    index: number;
    secret: number;
    nullifier: number;
  };
} 