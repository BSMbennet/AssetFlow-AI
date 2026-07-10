// ============================================
// API Types
// ============================================

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  path: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: APIError;
  headers?: Record<string, string>;
  timestamp: Date;
  duration: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface AuthRequest extends APIRequest {
  auth: {
    type: 'JWT' | 'API_KEY' | 'OAUTH2' | 'BASIC';
    token: string;
  };
}

export interface PaginatedAPIRequest extends APIRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  filters?: Record<string, any>;
}

export interface FileUploadRequest extends APIRequest {
  file: File | Buffer;
  filename: string;
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface WebSocketRequest {
  namespace: string;
  event: string;
  data: any;
  room?: string;
  broadcast?: boolean;
}