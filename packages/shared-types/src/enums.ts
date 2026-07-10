// ============================================
// Application Enums
// ============================================

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum CachePrefix {
  ASSET = 'asset:',
  USER = 'user:',
  SESSION = 'session:',
  TRADE = 'trade:',
  ORDER = 'order:',
  COMPLIANCE = 'compliance:',
  AI = 'ai:',
  RATE_LIMIT = 'ratelimit:',
}

export enum QueueName {
  EMAIL = 'email',
  SMS = 'sms',
  NOTIFICATION = 'notification',
  DOCUMENT_PROCESSING = 'document-processing',
  AI_PROCESSING = 'ai-processing',
  TRADE_SETTLEMENT = 'trade-settlement',
  COMPLIANCE_CHECK = 'compliance-check',
  BLOCKCHAIN_EVENT = 'blockchain-event',
  ANALYTICS = 'analytics',
  REPORT_GENERATION = 'report-generation',
}

export enum EventType {
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged-in',
  USER_LOGGED_OUT = 'user.logged-out',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  ASSET_CREATED = 'asset.created',
  ASSET_UPDATED = 'asset.updated',
  ASSET_TOKENIZED = 'asset.tokenized',
  ASSET_APPROVED = 'asset.approved',
  ASSET_REJECTED = 'asset.rejected',
  TRADE_EXECUTED = 'trade.executed',
  TRADE_SETTLED = 'trade.settled',
  PAYMENT_PROCESSED = 'payment.processed',
  PAYMENT_FAILED = 'payment.failed',
  COMPLIANCE_CASE_CREATED = 'compliance.case.created',
  COMPLIANCE_CASE_UPDATED = 'compliance.case.updated',
  COMPLIANCE_CASE_CLOSED = 'compliance.case.closed',
  NOTIFICATION_SENT = 'notification.sent',
  BLOCKCHAIN_TRANSACTION_CONFIRMED = 'blockchain.transaction.confirmed',
  BLOCKCHAIN_EVENT_EMITTED = 'blockchain.event.emitted',
}

export enum Permission {
  // User permissions
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  
  // Organization permissions
  ORG_VIEW = 'org:view',
  ORG_UPDATE = 'org:update',
  ORG_MANAGE = 'org:manage',
  
  // Asset permissions
  ASSETS_VIEW = 'assets:view',
  ASSETS_CREATE = 'assets:create',
  ASSETS_UPDATE = 'assets:update',
  ASSETS_DELETE = 'assets:delete',
  ASSETS_APPROVE = 'assets:approve',
  ASSETS_TOKENIZE = 'assets:tokenize',
  
  // Trading permissions
  TRADING_VIEW = 'trading:view',
  TRADING_EXECUTE = 'trading:execute',
  TRADING_CANCEL = 'trading:cancel',
  
  // Compliance permissions
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_REVIEW = 'compliance:review',
  COMPLIANCE_ESCALATE = 'compliance:escalate',
  COMPLIANCE_CLOSE = 'compliance:close',
  
  // Admin permissions
  ADMIN_VIEW = 'admin:view',
  ADMIN_MANAGE = 'admin:manage',
  ADMIN_SYSTEM = 'admin:system',
  
  // AI permissions
  AI_ANALYZE = 'ai:analyze',
  AI_TRAIN = 'ai:train',
  AI_DEPLOY = 'ai:deploy',
  
  // Blockchain permissions
  BLOCKCHAIN_VIEW = 'blockchain:view',
  BLOCKCHAIN_DEPLOY = 'blockchain:deploy',
  BLOCKCHAIN_INTERACT = 'blockchain:interact',
}

export const PermissionGroups = {
  ADMIN: [
    Permission.ADMIN_VIEW,
    Permission.ADMIN_MANAGE,
    Permission.ADMIN_SYSTEM,
  ],
  ASSET_MANAGER: [
    Permission.ASSETS_VIEW,
    Permission.ASSETS_CREATE,
    Permission.ASSETS_UPDATE,
    Permission.ASSETS_TOKENIZE,
  ],
  COMPLIANCE_OFFICER: [
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_REVIEW,
    Permission.COMPLIANCE_ESCALATE,
    Permission.COMPLIANCE_CLOSE,
  ],
  INVESTOR: [
    Permission.ASSETS_VIEW,
    Permission.TRADING_VIEW,
    Permission.TRADING_EXECUTE,
  ],
};