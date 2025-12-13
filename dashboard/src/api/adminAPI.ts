import axiosClient from './axiosClient';

export interface AdminStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  admin_users: number;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  telegram_id: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  users: UserDetail[];
  total: number;
  skip: number;
  limit: number;
}

export interface MaintenanceModeResponse {
  is_maintenance: boolean;
  message: string;
}

export interface MaintenanceModeRequest {
  enabled: boolean;
  message?: string;
}

export interface BroadcastAlertRequest {
  message: string;
  title?: string;
}

export interface SendAlertToUserRequest {
  user_id: number;
  message: string;
  title?: string;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  logo_filename: string | null;
  brand_color: string | null;
  logo_background: string | null;
  logo_size_width: number | null;
  logo_size_height: number | null;
  country: string;
  is_active: boolean;
}

export interface BankCreateRequest {
  name: string;
  code: string;
  country?: string;
  brand_color?: string;
  logo_background?: string;
  logo_size_width?: number;
  logo_size_height?: number;
}

export interface BankLogoUpdateRequest {
  brand_color?: string;
  logo_background?: string;
  logo_size_width?: number;
  logo_size_height?: number;
  is_active?: boolean;
}

export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const response = await axiosClient.get('/admin/stats');
    return response.data;
  },

  listUsers: async (skip: number = 0, limit: number = 100, search?: string): Promise<UserListResponse> => {
    const params: any = { skip, limit };
    if (search) params.search = search;
    const response = await axiosClient.get('/admin/users', { params });
    return response.data;
  },

  getUserDetail: async (userId: number): Promise<UserDetail> => {
    const response = await axiosClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId: number, suspend: boolean): Promise<{ message: string; user: UserDetail }> => {
    const response = await axiosClient.put(`/admin/users/${userId}/suspend`, { suspend });
    return response.data;
  },

  updateUserRole: async (userId: number, role: 'admin' | 'user'): Promise<UserDetail> => {
    const response = await axiosClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ message: string; deleted_user_id: number }> => {
    const response = await axiosClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getMaintenanceMode: async (): Promise<MaintenanceModeResponse> => {
    const response = await axiosClient.get('/admin/maintenance');
    return response.data;
  },

  setMaintenanceMode: async (request: MaintenanceModeRequest): Promise<MaintenanceModeResponse> => {
    const response = await axiosClient.put('/admin/maintenance', request);
    return response.data;
  },

  broadcastAlert: async (request: BroadcastAlertRequest): Promise<{ message: string; users_count: number; telegram_sent: number; telegram_failed: number; telegram_total: number; content: string }> => {
    const response = await axiosClient.post('/admin/broadcast', request);
    return response.data;
  },

  sendAlertToUser: async (request: SendAlertToUserRequest): Promise<{ message: string; user_id: number; user_name: string; user_email: string; telegram_sent: number; telegram_failed: number; telegram_total: number }> => {
    const response = await axiosClient.post('/admin/send-alert', request);
    return response.data;
  },

  listBanks: async (): Promise<{ banks: Bank[] }> => {
    const response = await axiosClient.get('/admin/banks');
    return response.data;
  },

  updateBankLogo: async (bankId: number, logoFile: File): Promise<{ message: string; bank: Bank; logo_path: string }> => {
    const formData = new FormData();
    formData.append('logo_file', logoFile);
    const response = await axiosClient.put(`/admin/banks/${bankId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateBankSettings: async (bankId: number, request: BankLogoUpdateRequest): Promise<{ message: string; bank: Bank }> => {
    const response = await axiosClient.put(`/admin/banks/${bankId}`, request);
    return response.data;
  },

  createBank: async (request: BankCreateRequest): Promise<{ message: string; bank: Bank }> => {
    const response = await axiosClient.post('/admin/banks', request);
    return response.data;
  },

  deleteBank: async (bankId: number): Promise<{ message: string; deleted_bank_id: number }> => {
    const response = await axiosClient.delete(`/admin/banks/${bankId}`);
    return response.data;
  },
};

