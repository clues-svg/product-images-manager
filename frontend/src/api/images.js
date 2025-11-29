import apiClient from './client';

export const imagesAPI = {
  // 获取图片列表
  getImages: async (params = {}) => {
    const response = await apiClient.get('/images', { params });
    return response.data; // 后端返回 { code: 0, data: {...} }，这里取 data 字段
  },

  // 获取单张图片详情
  getImage: async (id) => {
    const response = await apiClient.get(`/images/${id}`);
    return response.data;
  },

  // 上传图片
  uploadImage: async (formData) => {
    const response = await apiClient.post('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 更新图片信息
  updateImage: async (id, data) => {
    const response = await apiClient.put(`/images/${id}`, data);
    return response.data;
  },

  // 删除图片
  deleteImage: async (id) => {
    const response = await apiClient.delete(`/images/${id}`);
    return response.data;
  },
};