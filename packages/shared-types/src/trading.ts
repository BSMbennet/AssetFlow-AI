// ============================================
// Trading Types
// ============================================

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderTimeInForce {
  GTC = 'GTC', // Good 'til Cancelled
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK', // Fill or Kill
  DAY = 'DAY', // Day Order
  GTD = 'GTD', // Good 'til Date
}

export enum OrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  PARTIALLY_SETTLED = 'PARTIALLY_SETTLED',
}

export interface Order {
  id: string;
  assetId: string;
  userId: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  averagePrice?: number;
  status: OrderStatus;
  timeInForce: OrderTimeInForce;
  expiresAt?: Date;
  stopPrice?: number;
  limitPrice?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  side: OrderSide;
  assetId: string;
  orderId: string;
  timestamp: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  amount: number;
  total: number;
  fee: number;
  feeCurrency: string;
  feeRate: number;
  executedAt: Date;
  settlementStatus: SettlementStatus;
  settlementDate?: Date;
  transactionHash?: string;
}

export interface Position {
  id: string;
  userId: string;
  assetId: string;
  tokenId?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeHistory {
  trades: Trade[];
  totalVolume: number;
  totalTrades: number;
  averagePrice: number;
  startDate: Date;
  endDate: Date;
}

export interface MarketData {
  assetId: string;
  price: number;
  volume: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  open24h: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  updatedAt: Date;
}