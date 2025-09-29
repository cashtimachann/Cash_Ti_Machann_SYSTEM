import { getAuthHeaders as getAuthenticationHeaders } from '../utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Type definitions
export interface AdminTransaction {
  id: string;
  transaction_id: string;
  type: AdminTransactionType;
  status: AdminTransactionStatus;
  amount: number;
  fee: number;
  currency: string;
  created_at: string;
  updated_at: string;
  description?: string;
  reference_number?: string;
  from_user?: AdminUser;
  to_user?: AdminUser;
  agent?: AdminUser;
  merchant?: AdminUser;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  user_type: 'CLIENT' | 'AGENT' | 'MERCHANT' | 'ADMIN';
}

export enum AdminTransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  TOP_UP = 'TOP_UP',
  FEE = 'FEE'
}

export enum AdminTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING'
}

export interface AdminTransactionFilters {
  status?: AdminTransactionStatus | string;
  type?: AdminTransactionType | string;
  user_type?: 'CLIENT' | 'AGENT' | 'MERCHANT' | string;
  start_date?: string;
  end_date?: string;
  search?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

export interface AdminPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminStatusUpdateRequest {
  status: AdminTransactionStatus;
  note?: string;
}

// Helper function to transform backend data to frontend format
const transformBackendTransaction = (backendData: any): AdminTransaction => {
  return {
    id: backendData.id,
    transaction_id: backendData.transaction_id,
    type: backendData.transaction_type || backendData.type,
    status: backendData.status,
    amount: parseFloat(backendData.amount),
    fee: parseFloat(backendData.fee || '0'),
    currency: backendData.currency || 'HTG',
    created_at: backendData.created_at,
    updated_at: backendData.updated_at,
    description: backendData.description,
    reference_number: backendData.reference_number,
    from_user: backendData.from_user,
    to_user: backendData.to_user,
    agent: backendData.agent,
    merchant: backendData.merchant,
  };
};

export class AdminTransactionService {
  // Get all transactions with filtering and pagination
  static async getAllTransactions(filters: AdminTransactionFilters = {}): Promise<AdminPaginatedResponse<AdminTransaction>> {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.status && filters.status !== 'Tout') params.append('status', filters.status);
      if (filters.type && filters.type !== 'Tout') params.append('type', filters.type);
      if (filters.user_type && filters.user_type !== 'Tout') params.append('user_type', filters.user_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);
      if (filters.min_amount) params.append('min_amount', filters.min_amount.toString());
      if (filters.max_amount) params.append('max_amount', filters.max_amount.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/transactions/admin/all/?${params.toString()}`, {
        method: 'GET',
        headers: getAuthenticationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our interface
      return {
        ...data,
        results: data.results.map(transformBackendTransaction)
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Get a single transaction by ID
  static async getTransaction(id: string): Promise<AdminTransaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/admin/${id}/`, {
        method: 'GET',
        headers: getAuthenticationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformBackendTransaction(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  // Update transaction status
  static async updateTransactionStatus(id: string, request: AdminStatusUpdateRequest): Promise<AdminTransaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/admin/${id}/status/`, {
        method: 'PATCH',
        headers: {
          ...getAuthenticationHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformBackendTransaction(data);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Get transaction history
  static async getTransactionHistory(id: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/admin/${id}/history/`, {
        method: 'GET',
        headers: getAuthenticationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }
}

export default AdminTransactionService;