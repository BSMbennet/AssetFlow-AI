// ============================================
// Blockchain Types
// ============================================

export enum BlockchainNetwork {
  ETHEREUM = 'ETHEREUM',
  POLYGON = 'POLYGON',
  BINANCE = 'BINANCE',
  ARBITRUM = 'ARBITRUM',
  OPTIMISM = 'OPTIMISM',
  AVALANCHE = 'AVALANCHE',
  BASE = 'BASE',
  ZKSYNC = 'ZKSYNC',
  LINEA = 'LINEA',
  MANTLE = 'MANTLE',
  SOLANA = 'SOLANA',
  OTHER = 'OTHER',
}

export enum TokenStandard {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  ERC777 = 'ERC777',
  ERC1400 = 'ERC1400',
  SPL = 'SPL',
  OTHER = 'OTHER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
  DROPPED = 'DROPPED',
}

export interface Token {
  id: string;
  assetId: string;
  address: string;
  network: BlockchainNetwork;
  standard: TokenStandard;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  tokenPrice: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: TokenMetadata;
}

export interface TokenMetadata {
  logoUrl?: string;
  website?: string;
  description?: string;
  socialLinks?: SocialLinks;
  tags?: string[];
  auditReports?: string[];
  governance?: GovernanceInfo;
}

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  medium?: string;
}

export interface GovernanceInfo {
  isGovernanceToken: boolean;
  votingPower?: string;
  proposals?: number;
  delegates?: number;
}

export interface TokenHolder {
  id: string;
  tokenId: string;
  userId: string;
  walletAddress: string;
  balance: number;
  locked: number;
  staked: number;
  acquiredAt: Date;
  updatedAt: Date;
  lastTransactionAt?: Date;
}

export interface BlockchainTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  gasUsed: number;
  gasPrice: number;
  status: TransactionStatus;
  blockNumber?: number;
  blockHash?: string;
  timestamp: Date;
  data?: Record<string, any>;
  confirmations: number;
  transactionIndex?: number;
  receipt?: TransactionReceipt;
}

export interface TransactionReceipt {
  status: boolean;
  contractAddress?: string;
  logs: TransactionLog[];
  cumulativeGasUsed: number;
  effectiveGasPrice: number;
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  eventName?: string;
  eventArgs?: Record<string, any>;
}

export interface SmartContract {
  id: string;
  name: string;
  address: string;
  network: BlockchainNetwork;
  standard: TokenStandard;
  version: string;
  abi: Record<string, any>[];
  bytecode: string;
  deployedAt: Date;
  verified: boolean;
  sourceCode?: string;
  compilerVersion?: string;
  optimizationUsed?: boolean;
}

export interface BlockchainEvent {
  id: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  args: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
}