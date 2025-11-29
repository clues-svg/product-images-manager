import apiClient from './client';

export const authAPI = {
  // 用户登录
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response;
  },

  // 用户注册
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response;
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};