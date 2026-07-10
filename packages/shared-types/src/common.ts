// ============================================
// Common Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  filters?: Record<string, any>;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SoftDeletable {
  deletedAt?: Date;
}

export interface Identifiable {
  id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface WebSocketMessage<T> {
  type: string;
  data: T;
  timestamp: Date;
  messageId: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP';
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface Settings {
  id: string;
  key: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENCRYPTED';
  category: string;
  description?: string;
  isGlobal: boolean;
  organizationId?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}