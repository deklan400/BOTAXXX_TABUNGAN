import axiosClient from './axiosClient';

export interface Target {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: 'active' | 'done';
  note: string | null;
}

export interface TargetCreateRequest {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  note?: string | null;
}

export interface TargetUpdateRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  add_amount?: number; // Amount to add to current amount (for incremental updates)
  deadline?: string | null;
  status?: 'active' | 'done';
  note?: string | null;
}

export const targetsAPI = {
  list: async (skip = 0, limit = 100, status?: string): Promise<Target[]> => {
    const url = status
      ? `/targets?skip=${skip}&limit=${limit}&status_filter=${status}`
      : `/targets?skip=${skip}&limit=${limit}`;
    const response = await axiosClient.get(url);
    return response.data;
  },

  get: async (id: number): Promise<Target> => {
    const response = await axiosClient.get(`/targets/${id}`);
    return response.data;
  },

  create: async (data: TargetCreateRequest): Promise<Target> => {
    const response = await axiosClient.post('/targets', data);
    return response.data;
  },

  update: async (id: number, data: TargetUpdateRequest): Promise<Target> => {
    const response = await axiosClient.put(`/targets/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/targets/${id}`);
  },
};
