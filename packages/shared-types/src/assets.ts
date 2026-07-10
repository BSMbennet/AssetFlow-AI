// ============================================
// Asset Types
// ============================================

export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  AGRICULTURE = 'AGRICULTURE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  RENEWABLE_ENERGY = 'RENEWABLE_ENERGY',
  BONDS = 'BONDS',
  PRIVATE_EQUITY = 'PRIVATE_EQUITY',
  CARBON_CREDITS = 'CARBON_CREDITS',
  INVOICE_FINANCING = 'INVOICE_FINANCING',
  COMMODITIES = 'COMMODITIES',
  ART = 'ART',
  COLLECTIBLES = 'COLLECTIBLES',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  SHIPPING = 'SHIPPING',
  AVIATION = 'AVIATION',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TOKENIZED = 'TOKENIZED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  MATURED = 'MATURED',
  LIQUIDATED = 'LIQUIDATED',
  EXPIRED = 'EXPIRED',
}

export enum AssetRiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Asset {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: AssetType;
  status: AssetStatus;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  availableTokens: number;
  jurisdiction: string;
  metadata: AssetMetadata;
  documents: AssetDocument[];
  images: AssetImage[];
  valuations: AssetValuation[];
  tokenAddress?: string;
  contractAddress?: string;
  riskScore?: number;
  riskLevel?: AssetRiskLevel;
  maturityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AssetMetadata {
  yearBuilt?: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm' | 'acres' | 'hectares';
  location?: AssetLocation;
  zoning?: string;
  occupancy?: number;
  leaseInfo?: LeaseInfo;
  financials?: FinancialInfo;
  environmental?: EnvironmentalInfo;
  legal?: LegalInfo;
  [key: string]: any;
}

export interface AssetLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  region?: string;
}

export interface LeaseInfo {
  tenants: Tenant[];
  annualRent: number;
  leaseExpiry?: Date;
  occupancyRate: number;
  leaseType: 'NET' | 'GROSS' | 'MODIFIED' | 'OTHER';
}

export interface Tenant {
  name: string;
  leasedArea: number;
  rent: number;
  leaseStart: Date;
  leaseEnd: Date;
  industry: string;
}

export interface FinancialInfo {
  revenue?: number;
  expenses?: number;
  netOperatingIncome?: number;
  cashFlow?: number;
  debt?: number;
  equity?: number;
  capRate?: number;
  yield?: number;
  irr?: number;
}

export interface EnvironmentalInfo {
  certifications?: string[];
  energyEfficiency?: number;
  carbonFootprint?: number;
  sustainabilityScore?: number;
  environmentalReports?: string[];
}

export interface LegalInfo {
  titleId?: string;
  deedId?: string;
  ownershipStructure: string;
  restrictions?: string[];
  easements?: string[];
  lienStatus?: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  name: string;
  type: string;
  category: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  verified: boolean;
  verifiedAt?: Date;
  aiAnalysis?: AssetDocumentAnalysis;
  tags?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetDocumentAnalysis {
  summary: string;
  keyPoints: string[];
  entities: Record<string, string[]>;
  confidence: number;
  riskIndicators: string[];
  recommendations: string[];
}

export interface AssetImage {
  id: string;
  assetId: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  tags?: string[];
  createdAt: Date;
}

export interface AssetValuation {
  id: string;
  assetId: string;
  value: number;
  currency: string;
  method: 'APPRAISAL' | 'AI' | 'MARKET' | 'COST' | 'INCOME' | 'HYBRID';
  provider: string;
  reportUrl?: string;
  aiConfidence?: number;
  notes?: string;
  createdAt: Date;
  expiresAt?: Date;
  comparables?: AssetComparable[];
  adjustments?: ValuationAdjustment[];
}

export interface AssetComparable {
  id: string;
  value: number;
  similarity: number;
  date: Date;
  location: string;
  size: number;
  attributes: Record<string, any>;
}

export interface ValuationAdjustment {
  factor: string;
  adjustment: number;
  reason: string;
}