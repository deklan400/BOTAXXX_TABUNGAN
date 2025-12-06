import axiosClient from './axiosClient';

export interface LoanPayment {
  id: number;
  loan_id: number;
  date: string;
  amount: number;
  note: string | null;
}

export interface Loan {
  id: number;
  user_id: number;
  borrower_name: string;
  principal: number;
  start_date: string;
  due_date: string | null;
  status: 'active' | 'paid' | 'overdue';
  note: string | null;
  remaining_amount: number;
  payments: LoanPayment[];
}

export interface LoanCreateRequest {
  borrower_name: string;
  principal: number;
  start_date: string;
  due_date?: string | null;
  note?: string | null;
}

export interface LoanUpdateRequest {
  borrower_name?: string;
  principal?: number;
  start_date?: string;
  due_date?: string | null;
  status?: 'active' | 'paid' | 'overdue';
  note?: string | null;
}

export interface LoanPaymentCreateRequest {
  date: string;
  amount: number;
  note?: string | null;
}

export const loansAPI = {
  list: async (skip = 0, limit = 100, status?: string): Promise<Loan[]> => {
    const url = status
      ? `/loans?skip=${skip}&limit=${limit}&status_filter=${status}`
      : `/loans?skip=${skip}&limit=${limit}`;
    const response = await axiosClient.get(url);
    return response.data;
  },

  get: async (id: number): Promise<Loan> => {
    const response = await axiosClient.get(`/loans/${id}`);
    return response.data;
  },

  create: async (data: LoanCreateRequest): Promise<Loan> => {
    const response = await axiosClient.post('/loans', data);
    return response.data;
  },

  update: async (id: number, data: LoanUpdateRequest): Promise<Loan> => {
    const response = await axiosClient.put(`/loans/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/loans/${id}`);
  },

  addPayment: async (loanId: number, data: LoanPaymentCreateRequest): Promise<LoanPayment> => {
    const response = await axiosClient.post(`/loans/${loanId}/payments`, data);
    return response.data;
  },

  getPayments: async (loanId: number): Promise<LoanPayment[]> => {
    const response = await axiosClient.get(`/loans/${loanId}/payments`);
    return response.data;
  },
};
