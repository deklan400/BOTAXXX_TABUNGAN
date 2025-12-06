import axiosClient from './axiosClient';

export interface Savings {
  id: number;
  user_id: number;
  date: string;
  type: 'IN' | 'OUT';
  category: string | null;
  amount: number;
  note: string | null;
}

export interface SavingsCreateRequest {
  date: string;
  type: 'IN' | 'OUT';
  category?: string | null;
  amount: number;
  note?: string | null;
}

export interface SavingsUpdateRequest {
  date?: string;
  type?: 'IN' | 'OUT';
  category?: string | null;
  amount?: number;
  note?: string | null;
}

export interface BalanceResponse {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

export const savingsAPI = {
  list: async (skip = 0, limit = 100): Promise<Savings[]> => {
    const response = await axiosClient.get(`/savings?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  get: async (id: number): Promise<Savings> => {
    const response = await axiosClient.get(`/savings/${id}`);
    return response.data;
  },

  create: async (data: SavingsCreateRequest): Promise<Savings> => {
    const response = await axiosClient.post('/savings', data);
    return response.data;
  },

  update: async (id: number, data: SavingsUpdateRequest): Promise<Savings> => {
    const response = await axiosClient.put(`/savings/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/savings/${id}`);
  },

  getBalance: async (): Promise<BalanceResponse> => {
    const response = await axiosClient.get('/savings/balance');
    return response.data;
  },
};
