import apiClient from './client';

export const tagsAPI = {
  // 获取标签列表
  getTags: async (params) => {
    const response = await apiClient.get('/tags', { params });
    return response;
  },

  // 创建标签
  createTag: async (tagData) => {
    const response = await apiClient.post('/tags', tagData);
    return response;
  },

  // 更新标签
  updateTag: async (id, tagData) => {
    const response = await apiClient.put(`/tags/${id}`, tagData);
    return response;
  },

  // 删除标签
  deleteTag: async (id) => {
    const response = await apiClient.delete(`/tags/${id}`);
    return response;
  },

  // 批量删除标签
  batchDeleteTags: async (ids) => {
    const response = await apiClient.delete('/tags/batch', { data: { ids } });
    return response;
  },

  // 合并标签
  mergeTags: async (sourceIds, targetId) => {
    const response = await apiClient.post('/tags/merge', { sourceIds, targetId });
    return response;
  },

  // 批量应用标签
  batchApplyTag: async (data) => {
    const response = await apiClient.post('/tags/batch-apply', data);
    return response;
  }
};