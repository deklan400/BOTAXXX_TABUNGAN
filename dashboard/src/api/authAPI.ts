import axiosClient from './axiosClient';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TelegramLoginRequest {
  telegram_id: string;
  telegram_username?: string;
  chat_id?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authAPI = {
  register: async (data: RegisterRequest) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await axiosClient.post('/auth/login', data);
    const tokenData = response.data;
    localStorage.setItem('token', tokenData.access_token);
    return tokenData;
  },

  telegramLogin: async (data: TelegramLoginRequest): Promise<TokenResponse> => {
    const response = await axiosClient.post('/auth/telegram-login', data);
    const tokenData = response.data;
    localStorage.setItem('token', tokenData.access_token);
    return tokenData;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getGoogleAuthUrl: () => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/google`;
  },
};
