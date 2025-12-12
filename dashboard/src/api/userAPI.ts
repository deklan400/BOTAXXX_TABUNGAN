import axiosClient from './axiosClient';

export interface User {
  id: number;
  name: string;
  email: string;
  telegram_id: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar_url?: string;
}

export interface UpdateTelegramIDRequest {
  telegram_id: string;
}

export interface TelegramID {
  id: number;
  telegram_id: string;
  telegram_username?: string;
  created_at: string;
}

export const userAPI = {
  getMe: async (): Promise<User> => {
    const response = await axiosClient.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put('/users/me', data);
    return response.data;
  },

  updateTelegramID: async (data: UpdateTelegramIDRequest) => {
    const response = await axiosClient.put('/users/me/telegram-id', data);
    return response.data;
  },

  getTelegramIDs: async (): Promise<TelegramID[]> => {
    const response = await axiosClient.get('/users/me/telegram-ids');
    return response.data;
  },

  addTelegramID: async (data: { telegram_id: string; telegram_username?: string }): Promise<TelegramID> => {
    const response = await axiosClient.post('/users/me/telegram-ids', data);
    return response.data;
  },

  deleteTelegramID: async (telegramIdId: number): Promise<void> => {
    await axiosClient.delete(`/users/me/telegram-ids/${telegramIdId}`);
  },
};
