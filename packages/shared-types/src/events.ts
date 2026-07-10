// ============================================
// Event Types
// ============================================

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  causationId?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserEvent extends DomainEvent {
  aggregateType: 'USER';
  data: {
    userId: string;
    email: string;
    action: 'REGISTERED' | 'LOGGED_IN' | 'LOGGED_OUT' | 'UPDATED' | 'DELETED';
    changes?: Record<string, any>;
  };
}

export interface AssetEvent extends DomainEvent {
  aggregateType: 'ASSET';
  data: {
    assetId: string;
    organizationId: string;
    action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'TOKENIZED' | 'DELETED';
    changes?: Record<string, any>;
  };
}

export interface TradeEvent extends DomainEvent {
  aggregateType: 'TRADE';
  data: {
    tradeId: string;
    assetId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    price: number;
    total: number;
    status: 'EXECUTED' | 'SETTLED' | 'FAILED';
  };
}

export interface PaymentEvent extends DomainEvent {
  aggregateType: 'PAYMENT';
  data: {
    paymentId: string;
    userId: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    method: string;
  };
}

export interface NotificationEvent extends DomainEvent {
  aggregateType: 'NOTIFICATION';
  data: {
    notificationId: string;
    userId: string;
    type: string;
    channel: string;
    sent: boolean;
    delivered: boolean;
  };
}

export interface ComplianceEvent extends DomainEvent {
  aggregateType: 'COMPLIANCE';
  data: {
    caseId: string;
    userId: string;
    type: string;
    status: string;
    priority: string;
    action: 'CREATED' | 'UPDATED' | 'ESCALATED' | 'CLOSED';
  };
}

export interface BlockchainEvent extends DomainEvent {
  aggregateType: 'BLOCKCHAIN';
  data: {
    transactionHash: string;
    contractAddress: string;
    eventName: string;
    args: Record<string, any>;
    network: string;
    confirmations: number;
  };
}