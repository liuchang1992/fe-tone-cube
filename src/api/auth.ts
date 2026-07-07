import apiClient from './client';

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export const register = async (data: RegisterRequest): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  // 保存 token 到 localStorage
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('username', response.data.username);
  }
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getStoredUsername = (): string | null => {
  return localStorage.getItem('username');
};