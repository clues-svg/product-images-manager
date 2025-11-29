import apiClient from './client';

export const aiAPI = {
  // 生成图片
  generateImage: async (formData) => {
    const response = await apiClient.post('/ai/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000 // 2 minutes timeout for AI generation
    });
    return response;
  }
};
