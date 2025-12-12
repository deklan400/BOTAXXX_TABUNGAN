import axiosClient from './axiosClient';

export interface Bank {
  id: number;
  name: string;
  code: string;
  logo_filename: string | null;
  brand_color: string | null;
  country: string;
  is_active: boolean;
}

export interface BankAccount {
  id: number;
  user_id: number;
  bank_id: number;
  account_holder_name: string;
  account_number: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  bank: Bank;
}

export interface BankAccountCreateRequest {
  bank_id: number;
  account_holder_name: string;
  account_number: string;
  is_primary?: boolean;
}

export interface BankAccountUpdateRequest {
  bank_id?: number;
  account_holder_name?: string;
  account_number?: string;
  is_active?: boolean;
  is_primary?: boolean;
}

export interface BankListResponse {
  banks: Bank[];
}

export interface BankAccountListResponse {
  bank_accounts: BankAccount[];
}

export const banksAPI = {
  // Bank Master Data
  listBanks: async (country?: string): Promise<Bank[]> => {
    const url = country ? `/banks/banks?country=${country}` : '/banks/banks';
    console.log('Fetching banks from:', url); // Debug log
    const response = await axiosClient.get<BankListResponse>(url);
    console.log('Banks API response:', response.data); // Debug log
    const banks = response.data?.banks || [];
    console.log('Banks array:', banks); // Debug log
    return banks;
  },

  getBank: async (id: number): Promise<Bank> => {
    const response = await axiosClient.get<Bank>(`/banks/banks/${id}`);
    return response.data;
  },

  // Bank Accounts
  listAccounts: async (skip = 0, limit = 100): Promise<BankAccount[]> => {
    const response = await axiosClient.get<BankAccountListResponse>(
      `/banks/accounts?skip=${skip}&limit=${limit}`
    );
    return response.data.bank_accounts;
  },

  getAccount: async (id: number): Promise<BankAccount> => {
    const response = await axiosClient.get<BankAccount>(`/banks/accounts/${id}`);
    return response.data;
  },

  createAccount: async (data: BankAccountCreateRequest): Promise<BankAccount> => {
    const response = await axiosClient.post<BankAccount>('/banks/accounts', data);
    return response.data;
  },

  updateAccount: async (id: number, data: BankAccountUpdateRequest): Promise<BankAccount> => {
    const response = await axiosClient.put<BankAccount>(`/banks/accounts/${id}`, data);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<void> => {
    await axiosClient.delete(`/banks/accounts/${id}`);
  },
};

