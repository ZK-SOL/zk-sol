// Define the deposit state type
export interface DepositStateType {
  secret?: number;
  nullifier?: number;
  amount?: number;
  showProof?: boolean;
  proofData?: {
    index: number;
    secret: number;
    nullifer: number;
  } | null;
} 