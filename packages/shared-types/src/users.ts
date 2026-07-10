// ============================================
// User Management Types
// ============================================

export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  ASSET_MANAGER = 'ASSET_MANAGER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  INVESTOR = 'INVESTOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  INVITED = 'INVITED',
}

export enum MFAMethod {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WEBAUTHN = 'WEBAUTHN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  walletAddress?: string;
  walletType?: 'METAMASK' | 'COINBASE' | 'TRUST' | 'OTHER';
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaMethod?: MFAMethod;
  mfaSecret?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  preferences?: UserPreferences;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: NotificationPreferences;
  dashboard?: DashboardPreferences;
  privacy?: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  types: string[];
}

export interface DashboardPreferences {
  defaultView: 'overview' | 'assets' | 'trading' | 'compliance';
  widgets: string[];
  layout: Record<string, any>;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'organization' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showWallet: boolean;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  createdAt: Date;
  revoked: boolean;
  revokedAt?: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

export interface UserInvite {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}