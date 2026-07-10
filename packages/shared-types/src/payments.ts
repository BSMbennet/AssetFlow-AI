// ============================================
// Payments Types
// ============================================

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  STABLECOIN = 'STABLECOIN',
  CRYPTO = 'CRYPTO',
  CARD = 'CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  ACH = 'ACH',
  WIRE = 'WIRE',
  USDC = 'USDC',
  USDT = 'USDT',
  DAI = 'DAI',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
  REVERSED = 'REVERSED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  COINBASE = 'COINBASE',
  PAYPAL = 'PAYPAL',
  CIRCLE = 'CIRCLE',
  WISE = 'WISE',
  AIRWALLEX = 'AIRWALLEX',
  OTHER = 'OTHER',
}

export interface Payment {
  id: string;
  userId: string;
  organizationId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerReference?: string;
  status: PaymentStatus;
  metadata: PaymentMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export interface PaymentMetadata {
  description?: string;
  invoiceId?: string;
  orderId?: string;
  assetId?: string;
  reference?: string;
  transactionHash?: string;
  confirmations?: number;
  exchangeRate?: number;
  fees?: PaymentFee[];
  customer?: PaymentCustomer;
  billingAddress?: PaymentAddress;
}

export interface PaymentFee {
  type: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface PaymentCustomer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
}

export interface PaymentAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  network: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  transactionHash: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
  amount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  confirmations: number;
  sender?: string;
  recipient?: string;
  fee: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface Dividend {
  id: string;
  assetId: string;
  amount: number;
  currency: string;
  perToken: number;
  recordDate: Date;
  paymentDate: Date;
  status: 'DECLARED' | 'PAID' | 'CANCELLED' | 'SCHEDULED';
  paidAt?: Date;
  distribution: DividendDistribution[];
  metadata?: Record<string, any>;
}

export interface DividendDistribution {
  userId: string;
  tokenHolderId: string;
  amount: number;
  tokensHeld: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paidAt?: Date;
  transactionHash?: string;
}