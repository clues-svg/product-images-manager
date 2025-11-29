import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Input, 
  Tag, 
  Space, 
  Cascader, 
  Radio,
  Button,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  TagsOutlined,
  UserOutlined,
  RobotOutlined,
  GlobalOutlined,
  EditOutlined
} from '@ant-design/icons';
import { tagsAPI } from '../../api/tags';

const { Option } = Select;
const { Search } = Input;

const AdvancedImageFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  stats = {},
  users = [],
  websites = [],
  aiModels = []
}) => {
  console.log('AdvancedImageFilters - 接收到的filters:', filters);
  console.log('AdvancedImageFilters - filters.tags:', filters.tags);
  
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 本地筛选状态，用于暂存用户的选择，不立即触发搜索
  const [localFilters, setLocalFilters] = useState(filters);

  // 同步外部 filters 到本地状态
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 获取可用标签
  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log('AdvancedImageFilters - 获取标签开始');
        const response = await tagsAPI.getTags();
        console.log('AdvancedImageFilters - 获取标签响应:', response);
        const tagsData = response.data?.tags || [];
        console.log('AdvancedImageFilters - 设置标签数据:', tagsData);
        setAvailableTags(tagsData.map(tag => ({
          value: tag.name,
          label: tag.name,
          ...tag
        })));
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    fetchTags();
  }, []);

  // 本地筛选变化处理
  const handleLocalFilterChange = (key, value) => {
    console.log(`AdvancedImageFilters - 本地筛选变化: ${key} =`, value);
    const newLocalFilters = {
      ...localFilters,
      [key]: value
    };
    console.log('AdvancedImageFilters - 新本地筛选状态:', newLocalFilters);
    setLocalFilters(newLocalFilters);
  };

  // 执行搜索
  const handleSearch = () => {
    console.log('AdvancedImageFilters - 执行搜索:', localFilters);
    onFiltersChange(localFilters);
  };

  // 清除筛选
  const handleClear = () => {
    const clearedFilters = {
      search: '',
      tags: [],
      tagLogic: 'and',
      sourceFilter: [],
      aspectRatio: '',
      sort: 'createdAt',
      order: 'DESC'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // 标签搜索过滤 - 支持模糊匹配
  const filteredTags = useMemo(() => {
    availableTags.forEach(tag => {
      const isMatch = tag.label.toLowerCase().includes(searchTerm.toLowerCase());
      console.log(`标签筛选 - 搜索词: "${searchTerm}", 标签: "${tag.label}", 匹配: ${isMatch}`);
    });
    
    if (!searchTerm) return availableTags;
    const filtered = availableTags.filter(tag => 
      tag.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log(`标签筛选结果 - 总标签: ${availableTags.length}, 搜索词: "${searchTerm}", 筛选结果: ${filtered.length}`, filtered);
    return filtered;
  }, [availableTags, searchTerm]);

  // 图片来源级联选项
  const sourceOptions = [
    {
      value: 'upload',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          用户上传
        </span>
      ),
      children: users.map(user => ({
        value: user.id,
        label: user.username
      }))
    },
    {
      value: 'processed',
      label: (
        <span>
          <EditOutlined style={{ marginRight: 4 }} />
          二次处理
        </span>
      ),
      children: [
        { value: 'original', label: '原始图片' },
        { value: 'background_removed', label: '背景移除' },
        { value: 'background_added', label: '场景添加' },
        { value: 'resized', label: '尺寸调整(<1000px)' }
      ]
    },
    {
      value: 'crawler',
      label: (
        <span>
          <GlobalOutlined style={{ marginRight: 4 }} />
          爬虫获取
        </span>
      ),
      children: websites.map(website => ({
        value: website.id,
        label: website.name
      }))
    },
    {
      value: 'ai_generated',
      label: (
        <span>
          <RobotOutlined style={{ marginRight: 4 }} />
          AI生成
        </span>
      ),
      children: aiModels.map(model => ({
        value: model.id,
        label: model.name
      }))
    }
  ];

  // 尺寸比例选项
  const aspectRatioOptions = [
    { value: 'wide', label: '接近3:1 (横长)' },
    { value: 'square', label: '接近1:1 (正方)' },
    { value: 'tall', label: '接近1:2 (竖长)' },
    { value: 'custom', label: '自定义比例' }
  ];

  // 计算活跃筛选数量
  const activeFiltersCount = [
    localFilters.search,
    localFilters.tags?.length > 0 ? localFilters.tags : null,
    localFilters.sourceFilter?.length > 0 ? localFilters.sourceFilter : null,
    localFilters.aspectRatio
  ].filter(Boolean).length;

  // 检查是否有未应用的筛选变化
  const hasUnappliedChanges = JSON.stringify(localFilters) !== JSON.stringify(filters);

  return (
    <Card className="advanced-filters" style={{ marginBottom: 16 }}>
      {/* 第一行：基础筛选 */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={8} md={6}>
          <Search
            placeholder="搜索图片名称..."
            value={localFilters.search}
            onChange={(e) => handleLocalFilterChange('search', e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
        </Col>
        
        <Col xs={24} sm={8} md={6}>
          <Cascader
            placeholder="选择图片来源"
            options={sourceOptions}
            value={localFilters.sourceFilter}
            onChange={(value) => handleLocalFilterChange('sourceFilter', value || [])}
            multiple
            maxTagCount="responsive"
            style={{ width: '100%' }}
          />
        </Col>
        
        <Col xs={24} sm={8} md={6}>
          <Select
            placeholder="选择尺寸比例"
            allowClear
            style={{ width: '100%' }}
            value={localFilters.aspectRatio}
            onChange={(value) => handleLocalFilterChange('aspectRatio', value)}
          >
            {aspectRatioOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={8} md={6}>
          <Space>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              disabled={!hasUnappliedChanges}
            >
              搜索
            </Button>
            <Button 
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={activeFiltersCount === 0}
            >
              清除
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* 第二行：标签筛选 */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={4} md={3}>
          <Space>
            <TagsOutlined />
            <span>标签筛选:</span>
          </Space>
        </Col>
        
        <Col xs={24} sm={8} md={6}>
          <Radio.Group 
            value={localFilters.tagLogic} 
            onChange={(e) => handleLocalFilterChange('tagLogic', e.target.value)}
            size="small"
          >
            <Radio.Button value="and">与 (AND)</Radio.Button>
            <Radio.Button value="or">或 (OR)</Radio.Button>
          </Radio.Group>
        </Col>
        
        <Col xs={24} sm={12} md={10}>
          <Select
            mode="multiple"
            placeholder="输入标签名进行搜索..."
            style={{ width: '100%' }}
            value={localFilters.tags}
            onChange={(value) => {
              console.log('标签选择变化:', value);
              handleLocalFilterChange('tags', value);
            }}
            onSelect={(value) => {
              console.log('标签被选中:', value);
            }}
            onDeselect={(value) => {
              console.log('标签被取消选中:', value);
            }}
            allowClear
            showSearch
            searchValue={searchTerm}
            onSearch={(value) => {
              console.log('标签搜索:', value);
              setSearchTerm(value);
            }}
            filterOption={false}
            notFoundContent={searchTerm ? `未找到包含 "${searchTerm}" 的标签` : '暂无标签'}
            dropdownRender={(menu) => (
              <div>
                {menu}
                {searchTerm && filteredTags.length === 0 && (
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      没有找到包含 "{searchTerm}" 的标签
                    </div>
                  </div>
                )}
                {searchTerm && filteredTags.length > 0 && (
                  <div style={{ padding: '4px 8px', borderTop: '1px solid #f0f0f0', backgroundColor: '#f9f9f9' }}>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      找到 {filteredTags.length} 个包含 "{searchTerm}" 的标签
                    </div>
                  </div>
                )}
              </div>
            )}
          >
            {filteredTags.map(tag => (
              <Option key={tag.name} value={tag.name}>
                <Space>
                  <Tag size="small" color={tag.color || '#1890ff'}>
                    {tag.name}
                  </Tag>
                  {tag.count > 0 && (
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      ({tag.count})
                    </span>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={5}>
          <Space>
            <Tag 
              icon={<FilterOutlined />} 
              color={activeFiltersCount > 0 ? 'blue' : 'default'}
            >
              {activeFiltersCount} 个筛选
            </Tag>
            {hasUnappliedChanges && (
              <Tag color="orange">
                有未应用的更改
              </Tag>
            )}
          </Space>
        </Col>
      </Row>

      {/* 第三行：排序和统计 */}
      <Row gutter={[16, 16]} align="middle" style={{ marginTop: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Select
            placeholder="排序方式"
            style={{ width: '100%' }}
            value={`${localFilters.sort}-${localFilters.order}`}
            onChange={(value) => {
              const [sort, order] = value.split('-');
              handleLocalFilterChange('sort', sort);
              handleLocalFilterChange('order', order);
            }}
          >
            <Option value="createdAt-DESC">最新上传</Option>
            <Option value="createdAt-ASC">最早上传</Option>
            <Option value="size-DESC">文件最大</Option>
            <Option value="size-ASC">文件最小</Option>
            <Option value="aspectRatio-DESC">最宽图片</Option>
            <Option value="aspectRatio-ASC">最窄图片</Option>
            <Option value="filename-ASC">文件名A-Z</Option>
            <Option value="filename-DESC">文件名Z-A</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={16} md={18}>
          {/* 统计信息 */}
          {stats.total > 0 && (
            <Space wrap>
              <Tag color="blue">总计: {stats.total}</Tag>
              {stats.upload > 0 && <Tag color="blue">上传: {stats.upload}</Tag>}
              {stats.ai_generated > 0 && <Tag color="purple">AI: {stats.ai_generated}</Tag>}
              {stats.crawler > 0 && <Tag color="orange">爬虫: {stats.crawler}</Tag>}
              {stats.processed > 0 && <Tag color="green">处理: {stats.processed}</Tag>}
            </Space>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default AdvancedImageFilters;