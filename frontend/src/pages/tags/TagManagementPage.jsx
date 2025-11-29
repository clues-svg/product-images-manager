import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  message, 
  Popconfirm, 
  Select, 
  Statistic, 
  Row, 
  Col,
  Tooltip,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  MergeOutlined,
  TagOutlined,
  PictureOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import apiClient from '../../api/client';
import './TagManagementPage.less';

const { Search } = Input;
const { Option } = Select;

function TagManagementPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [summary, setSummary] = useState({
    totalTags: 0,
    totalUsage: 0
  });
  
  // 模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [batchApplyVisible, setBatchApplyVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  
  const [form] = Form.useForm();
  const [mergeForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [batchApplyForm] = Form.useForm();

  // 获取标签列表
  const fetchTags = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await apiClient.get('/tags', {
        params: {
          page,
          limit: pagination.pageSize,
          search,
          sort: 'count',
          order: 'DESC'
        }
      });

      if (response.code === 0) {
        setTags(response.data.tags);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination.total
        }));
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建标签
  const handleCreate = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // 保存新标签
  const handleSaveCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const response = await apiClient.post('/tags', {
        name: values.name,
        description: values.description
      });

      if (response.code === 0) {
        message.success('标签创建成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      message.error(error.message || '创建标签失败');
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchTags();
  }, []);

  // 搜索处理
  const handleSearch = (value) => {
    setSearchText(value);
    fetchTags(1, value);
  };

  // 实时搜索处理
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    // 防抖处理，500ms后执行搜索
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      fetchTags(1, value);
    }, 500);
  };

  // 清空搜索
  const handleSearchClear = () => {
    setSearchText('');
    fetchTags(1, '');
  };

  // 分页处理
  const handleTableChange = (paginationInfo) => {
    fetchTags(paginationInfo.current, searchText);
  };

  // 编辑标签
  const handleEdit = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue({ newName: tag.name });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      const response = await apiClient.put(`/tags/${editingTag.name}`, {
        newName: values.newName
      });

      if (response.code === 0) {
        message.success(`标签重命名成功，更新了 ${response.data.updatedImages} 张图片`);
        setEditModalVisible(false);
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('重命名标签失败:', error);
      message.error('重命名标签失败');
    }
  };

  // 删除标签
  const handleDelete = async (tagName) => {
    try {
      const response = await apiClient.delete(`/tags/${tagName}`);
      
      if (response.code === 0) {
        message.success(`标签删除成功，从 ${response.data.updatedImages} 张图片中移除`);
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      message.error('删除标签失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTags.length === 0) {
      message.warning('请选择要删除的标签');
      return;
    }

    try {
      const response = await apiClient.delete('/tags', {
        data: { tags: selectedTags }
      });

      if (response.code === 0) {
        message.success(`批量删除成功，更新了 ${response.data.updatedImages} 张图片`);
        setSelectedTags([]);
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    }
  };

  // 合并标签
  const handleMerge = () => {
    if (selectedTags.length < 2) {
      message.warning('请选择至少2个标签进行合并');
      return;
    }
    setMergeModalVisible(true);
  };

  // 保存合并
  const handleSaveMerge = async () => {
    try {
      const values = await mergeForm.validateFields();
      const response = await apiClient.post('/tags/merge', {
        sourceTags: selectedTags,
        targetTag: values.targetTag
      });

      if (response.code === 0) {
        message.success(`标签合并成功，更新了 ${response.data.updatedImages} 张图片`);
        setMergeModalVisible(false);
        setSelectedTags([]);
        mergeForm.resetFields();
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('合并标签失败:', error);
      message.error('合并标签失败');
    }
  };

  // 查看标签详情
  const handleViewDetails = (tagName) => {
    // 这里可以跳转到图片列表页面，并应用该标签的筛选
    window.open(`/images?tags=${encodeURIComponent(tagName)}`, '_blank');
  };

  // 批量应用标签
  const handleBatchApply = () => {
    batchApplyForm.resetFields();
    setBatchApplyVisible(true);
  };

  // 保存批量应用
  const handleSaveBatchApply = async () => {
    try {
      const values = await batchApplyForm.validateFields();
      const response = await apiClient.post('/tags/batch-apply', {
        rules: {
          includeKeywords: values.includeKeywords ? values.includeKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
          excludeKeywords: values.excludeKeywords ? values.excludeKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
          mustIncludeKeywords: values.mustIncludeKeywords ? values.mustIncludeKeywords.split(',').map(k => k.trim()).filter(k => k) : []
        },
        tagsToAdd: values.tagsToAdd ? values.tagsToAdd.split(',').map(t => t.trim()).filter(t => t) : []
      });

      if (response.code === 0) {
        message.success(`批量应用成功，为 ${response.data.updatedImages} 张图片添加了标签`);
        setBatchApplyVisible(false);
        batchApplyForm.resetFields();
        fetchTags(pagination.current, searchText);
      }
    } catch (error) {
      console.error('批量应用标签失败:', error);
      message.error('批量应用标签失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Tag 
            color="blue" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleViewDetails(text)}
          >
            <TagOutlined /> {text}
          </Tag>
        </Space>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: true,
      render: (count) => (
        <Badge count={count} showZero color="#52c41a" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看关联图片">
            <Button 
              type="link" 
              icon={<PictureOutlined />} 
              onClick={() => handleViewDetails(record.name)}
            />
          </Tooltip>
          <Tooltip title="重命名标签">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个标签吗？"
            description={`将从 ${record.count} 张图片中移除此标签`}
            onConfirm={() => handleDelete(record.name)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除标签">
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys: selectedTags,
    onChange: (selectedRowKeys) => {
      setSelectedTags(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      name: record.name,
    }),
  };

  return (
    <div className="tag-management-page">
      <div className="page-header">
        <h1>标签管理</h1>
        <p>管理图片标签，支持重命名、合并、删除等操作</p>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="标签总数"
              value={summary.totalTags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="使用总次数"
              value={summary.totalUsage}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均使用次数"
              value={summary.totalTags > 0 ? (summary.totalUsage / summary.totalTags).toFixed(1) : 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Search
                placeholder="搜索标签名称"
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                onClear={handleSearchClear}
                enterButton={<SearchOutlined />}
              />
              {searchText && (
                <span style={{ color: '#666', fontSize: '12px' }}>
                  找到 {pagination.total} 个匹配结果
                </span>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                创建标签
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleBatchApply}
              >
                批量应用标签
              </Button>
              <Button
                icon={<MergeOutlined />}
                onClick={handleMerge}
                disabled={selectedTags.length < 2}
              >
                合并标签 ({selectedTags.length})
              </Button>
              <Popconfirm
                title="确定要批量删除选中的标签吗？"
                onConfirm={handleBatchDelete}
                disabled={selectedTags.length === 0}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedTags.length === 0}
                >
                  批量删除 ({selectedTags.length})
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 标签表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="name"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 个标签`,
          }}
          rowSelection={rowSelection}
          onChange={handleTableChange}
        />
      </Card>

      {/* 编辑标签模态框 */}
      <Modal
        title="重命名标签"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="原标签名"
          >
            <Input value={editingTag?.name} disabled />
          </Form.Item>
          <Form.Item
            name="newName"
            label="新标签名"
            rules={[
              { required: true, message: '请输入新标签名' },
              { min: 1, max: 50, message: '标签名长度应在1-50字符之间' }
            ]}
          >
            <Input placeholder="请输入新标签名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建标签模态框 */}
      <Modal
        title="创建新标签"
        open={createModalVisible}
        onOk={handleSaveCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { min: 1, max: 50, message: '标签名长度应在1-50字符之间' },
              { pattern: /^[^\s]+$/, message: '标签名不能包含空格' }
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="标签描述（可选）"
            rules={[
              { max: 200, message: '描述长度不能超过200字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="请输入标签描述" 
              rows={3}
              showCount
              maxLength={200}
            />
          </Form.Item>
          <div style={{ color: '#666', fontSize: '12px' }}>
            提示：创建的标签可以在图片管理中使用，也可以通过图片上传时自动添加
          </div>
        </Form>
      </Modal>

      {/* 批量应用标签模态框 */}
      <Modal
        title="批量应用标签"
        open={batchApplyVisible}
        onOk={handleSaveBatchApply}
        onCancel={() => setBatchApplyVisible(false)}
        okText="应用"
        cancelText="取消"
        width={600}
      >
        <Form form={batchApplyForm} layout="vertical">
          <Form.Item
            name="tagsToAdd"
            label="要添加的标签"
            rules={[
              { required: true, message: '请输入要添加的标签' }
            ]}
          >
            <Input placeholder="请输入标签名，多个标签用逗号分隔，如：电池,工业设备,测试" />
          </Form.Item>
          
          <Form.Item
            name="includeKeywords"
            label="包含关键词（或条件）"
          >
            <Input placeholder="图片标题包含任一关键词，多个关键词用逗号分隔，如：电池,battery" />
          </Form.Item>
          
          <Form.Item
            name="mustIncludeKeywords"
            label="必须包含关键词（且条件）"
          >
            <Input placeholder="图片标题必须包含所有关键词，多个关键词用逗号分隔，如：高尔夫,球车" />
          </Form.Item>
          
          <Form.Item
            name="excludeKeywords"
            label="排除关键词"
          >
            <Input placeholder="图片标题不能包含这些关键词，多个关键词用逗号分隔，如：测试,demo" />
          </Form.Item>
          
          <div style={{ 
            background: '#f6f8fa', 
            padding: '12px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            color: '#666',
            marginTop: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>应用规则说明：</h4>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              <li><strong>包含关键词</strong>：图片标题包含任意一个关键词即匹配（或条件）</li>
              <li><strong>必须包含关键词</strong>：图片标题必须包含所有关键词才匹配（且条件）</li>
              <li><strong>排除关键词</strong>：图片标题包含任意一个排除关键词则不匹配</li>
              <li><strong>匹配逻辑</strong>：(包含关键词 OR 必须包含关键词) AND NOT 排除关键词</li>
            </ul>
            <p style={{ margin: '8px 0 0 0' }}>
              <strong>示例</strong>：要为所有包含"电池"但不包含"测试"的图片添加"电池设备"标签
            </p>
          </div>
        </Form>
      </Modal>

      {/* 合并标签模态框 */}
      <Modal
        title="合并标签"
        open={mergeModalVisible}
        onOk={handleSaveMerge}
        onCancel={() => setMergeModalVisible(false)}
        okText="合并"
        cancelText="取消"
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item label="要合并的标签">
            <div>
              {selectedTags.map(tag => (
                <Tag key={tag} color="blue" style={{ marginBottom: 8 }}>
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>
          <Form.Item
            name="targetTag"
            label="合并到目标标签"
            rules={[
              { required: true, message: '请输入目标标签名' },
              { min: 1, max: 50, message: '标签名长度应在1-50字符之间' }
            ]}
          >
            <Input placeholder="请输入目标标签名（可以是新标签或现有标签）" />
          </Form.Item>
          <div style={{ color: '#666', fontSize: '12px' }}>
            提示：所有选中的标签将被替换为目标标签，原标签将被删除
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default TagManagementPage;