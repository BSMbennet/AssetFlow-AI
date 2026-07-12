export interface TokenizeAssetRequest {
  assetId: string;
  name: string;
  symbol: string;
  totalTokens: string; // Passed as string to handle BigInt safely
  jurisdiction: string;
}

export interface TransferTokensRequest {
  assetContractAddress: string;
  recipientAddress: string;
  amount: string; 
}

export interface TransactionReceipt {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionHash: string;
  blockNumber?: number;
  contractAddress?: string;
  error?: string;
}