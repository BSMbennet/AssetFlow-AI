// ============================================
// Compliance Types
// ============================================

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  INCOMPLETE = 'INCOMPLETE',
}

export enum AmlRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  NATIONAL_ID = 'NATIONAL_ID',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  TAX_RETURN = 'TAX_RETURN',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  REGISTRATION_DOCUMENT = 'REGISTRATION_DOCUMENT',
  CERTIFICATE_OF_INCORPORATION = 'CERTIFICATE_OF_INCORPORATION',
  ACCREDITATION_LETTER = 'ACCREDITATION_LETTER',
  OTHER = 'OTHER',
}

export enum VerificationProvider {
  ONFIDO = 'ONFIDO',
  JUMIO = 'JUMIO',
  IDNOW = 'IDNOW',
  SHUFTI = 'SHUFTI',
  SUMSUB = 'SUMSUB',
  COMPLYADVANTAGE = 'COMPLYADVANTAGE',
  CHAINALYSIS = 'CHAINALYSIS',
  ELLIPTIC = 'ELLIPTIC',
  CUSTOM = 'CUSTOM',
}

export interface KycCheck {
  id: string;
  userId: string;
  status: KycStatus;
  provider: VerificationProvider;
  providerReference?: string;
  documents: KycDocument[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  expiresAt?: Date;
  result?: KycResult;
}

export interface KycDocument {
  id: string;
  kycCheckId: string;
  type: DocumentType;
  number?: string;
  issuingCountry?: string;
  issuingAuthority?: string;
  expiryDate?: Date;
  dateOfBirth?: Date;
  fileUrl: string;
  verified: boolean;
  verifiedAt?: Date;
  verificationData?: Record<string, any>;
  ocrData?: Record<string, any>;
}

export interface KycResult {
  passed: boolean;
  score: number;
  reason?: string;
  verificationData: Record<string, any>;
  redFlags: string[];
  recommendations: string[];
}

export interface AmlCheck {
  id: string;
  userId: string;
  provider: VerificationProvider;
  riskLevel: AmlRiskLevel;
  score: number;
  sanctionsMatch: boolean;
  pepMatch: boolean;
  adverseMedia: boolean;
  reportUrl?: string;
  checkedAt: Date;
  expiresAt: Date;
  screeningData: AmlScreeningData;
}

export interface AmlScreeningData {
  sanctions: SanctionsMatch[];
  pep: PEPMatch[];
  adverseMedia: AdverseMedia[];
  watchlists: string[];
  riskIndicators: string[];
}

export interface SanctionsMatch {
  name: string;
  country: string;
  program: string;
  list: string;
  matchType: 'EXACT' | 'PARTIAL' | 'FUZZY';
  confidence: number;
}

export interface PEPMatch {
  name: string;
  position: string;
  country: string;
  startDate?: Date;
  endDate?: Date;
  confidence: number;
}

export interface AdverseMedia {
  title: string;
  source: string;
  date: Date;
  summary: string;
  categories: string[];
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface ComplianceCase {
  id: string;
  type: ComplianceCaseType;
  status: ComplianceCaseStatus;
  priority: CompliancePriority;
  assignedTo?: string;
  assignedToName?: string;
  userId?: string;
  organizationId?: string;
  description: string;
  findings?: string;
  resolution?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export enum ComplianceCaseType {
  KYC = 'KYC',
  AML = 'AML',
  SANCTIONS = 'SANCTIONS',
  PEP = 'PEP',
  FRAUD = 'FRAUD',
  ADVERSE_MEDIA = 'ADVERSE_MEDIA',
  COMPLAINT = 'COMPLAINT',
  AUDIT = 'AUDIT',
  OTHER = 'OTHER',
}

export enum ComplianceCaseStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

export enum CompliancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  createdAt: Date;
}

export interface RegulatoryReport {
  id: string;
  organizationId: string;
  type: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  data: Record<string, any>;
  generatedAt: Date;
  filedAt?: Date;
  status: 'DRAFT' | 'PENDING' | 'FILED' | 'REJECTED';
}