// ============================================
// AI Service Types
// ============================================

export enum AIType {
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  OCR = 'OCR',
  CONTRACT_ANALYSIS = 'CONTRACT_ANALYSIS',
  DUE_DILIGENCE = 'DUE_DILIGENCE',
  RISK_SCORING = 'RISK_SCORING',
  VALUATION = 'VALUATION',
  COMPLIANCE = 'COMPLIANCE',
  TRADING = 'TRADING',
  SENTIMENT = 'SENTIMENT',
  PREDICTIVE = 'PREDICTIVE',
  NATURAL_LANGUAGE = 'NATURAL_LANGUAGE',
  IMAGE_RECOGNITION = 'IMAGE_RECOGNITION',
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum MemoGenerator {
  AI = 'AI',
  USER = 'USER',
  HYBRID = 'HYBRID',
}

export interface AIAnalysis {
  id: string;
  documentId: string;
  type: AIType;
  results: Record<string, any>;
  confidence: number;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  createdAt: Date;
  metadata?: AIContext;
}

export interface AIContext {
  model: string;
  version: string;
  provider: string;
  processingTime: number;
  tokensUsed: number;
  cost: number;
}

export interface RiskScore {
  id: string;
  assetId: string;
  score: number;
  factors: RiskFactor[];
  level: RiskLevel;
  summary: string;
  details: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  indicators: string[];
  mitigatingFactors: string[];
}

export interface InvestmentMemo {
  id: string;
  assetId: string;
  generatedBy: MemoGenerator;
  content: string;
  sections: MemoSections;
  keyMetrics: KeyMetrics;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface MemoSections {
  executiveSummary: string;
  investmentHighlights: string[];
  riskAssessment: string;
  financialAnalysis: string;
  marketAnalysis: string;
  valuationSummary: string;
  complianceOverview: string;
  recommendation: string;
  appendices?: Record<string, any>;
}

export interface KeyMetrics {
  totalValue: number;
  tokenPrice: number;
  marketCap: number;
  roi: number;
  irr: number;
  capRate: number;
  yield: number;
  riskAdjustedReturn: number;
  liquidityScore: number;
  complianceScore: number;
}

export interface AIAgent {
  id: string;
  name: string;
  type: AIType;
  status: 'ACTIVE' | 'INACTIVE' | 'TRAINING' | 'DEPLOYING';
  model: string;
  version: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  steps: AIWorkflowStep[];
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
  executionHistory: AIWorkflowExecution[];
}

export interface AIWorkflowStep {
  id: string;
  name: string;
  type: 'AI' | 'MANUAL' | 'AUTOMATED';
  agentId?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
}

export interface AIWorkflowExecution {
  id: string;
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
  errors: string[];
}