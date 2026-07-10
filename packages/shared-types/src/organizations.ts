// ============================================
// Organization Types
// ============================================

export enum OrganizationType {
  BANK = 'BANK',
  PROPERTY_DEVELOPER = 'PROPERTY_DEVELOPER',
  INVESTMENT_FIRM = 'INVESTMENT_FIRM',
  GOVERNMENT = 'GOVERNMENT',
  ASSET_MANAGER = 'ASSET_MANAGER',
  INSURANCE = 'INSURANCE',
  PENSION_FUND = 'PENSION_FUND',
  HEDGE_FUND = 'HEDGE_FUND',
  FAMILY_OFFICE = 'FAMILY_OFFICE',
  OTHER = 'OTHER',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  type: OrganizationType;
  status: OrganizationStatus;
  registrationNumber: string;
  taxId: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface OrganizationSettings {
  branding?: BrandingSettings;
  security?: SecuritySettings;
  compliance?: ComplianceSettings;
  features?: FeatureSettings;
  integrations?: IntegrationSettings;
}

export interface BrandingSettings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

export interface SecuritySettings {
  requireMFA: boolean;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  allowedIPs?: string[];
  allowAPIKeys: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number;
  preventReuse: number;
}

export interface ComplianceSettings {
  requireKYC: boolean;
  requireAML: boolean;
  jurisdiction: string[];
  investorAccreditationRequired: boolean;
  documentRetentionDays: number;
}

export interface FeatureSettings {
  enableTrading: boolean;
  enableTokenization: boolean;
  enableAI: boolean;
  enableAnalytics: boolean;
  enableWhiteLabel: boolean;
  enableMultiChain: boolean;
}

export interface IntegrationSettings {
  blockchainNetworks: string[];
  paymentProviders: string[];
  identityProviders: string[];
  dataProviders: string[];
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  permissions: string[];
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  status: 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REMOVED';
  groups?: string[];
  customAttributes?: Record<string, any>;
}

export interface OrganizationGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  permissions: string[];
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}