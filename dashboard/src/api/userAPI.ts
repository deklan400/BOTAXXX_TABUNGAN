import axiosClient from './axiosClient';

export interface User {
  id: number;
  name: string;
  email: string;
  telegram_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar_url?: string;
}

export interface UpdateTelegramIDRequest {
  telegram_id: string;
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
};
