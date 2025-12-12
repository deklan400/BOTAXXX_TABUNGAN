import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface MaintenanceStatus {
  is_maintenance: boolean;
  message: string;
}

export const maintenanceAPI = {
  getStatus: async (): Promise<MaintenanceStatus> => {
    const response = await publicClient.get('/maintenance');
    return response.data;
  },
};

