import apiClient from './client';

export const imageProcessingAPI = {
  // 去除背景
  removeBackground: async (imageId, options = {}) => {
    const response = await apiClient.post(
      `/image-processing/remove-background/${imageId}`,
      options
    );
    return response;
  },

  // 生成场景
  generateScene: async (productImageId, options = {}) => {
    const response = await apiClient.post(
      `/image-processing/generate-scene/${productImageId}`,
      options
    );
    return response;
  },

  // 批量处理
  batchProcess: async (operation, imageIds, options = {}) => {
    const response = await apiClient.post(
      `/image-processing/batch-process`,
      {
        operation,
        imageIds,
        options
      }
    );
    return response;
  },

  // 调整尺寸
  resize: async (imageId, options = {}) => {
    const response = await apiClient.post(
      `/image-processing/resize/${imageId}`,
      options
    );
    return response;
  },

  // 获取处理历史
  getProcessHistory: async (imageId) => {
    const response = await apiClient.get(
      `/image-processing/history/${imageId}`
    );
    return response;
  }
};