import React from 'react';
import { Card, Row, Col, Select, Input, Tag, Space } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const ImageFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  stats = {} 
}) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const sourceOptions = [
    { value: 'upload', label: '用户上传', color: 'blue' },
    { value: 'ai_generated', label: 'AI生成', color: 'purple' },
    { value: 'crawler', label: '爬虫获取', color: 'orange' },
    { value: 'processed', label: '二次处理', color: 'green' }
  ];

  const processStatusOptions = [
    { value: 'original', label: '原始图片', color: 'default' },
    { value: 'background_removed', label: '背景移除', color: 'red' },
    { value: 'background_added', label: '背景添加', color: 'blue' },
    { value: 'resized', label: '尺寸调整', color: 'orange' },
    { value: 'converted', label: '格式转换', color: 'purple' }
  ];

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

  return (
    <Card className="image-filters">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="搜索图片名称..."
            allowClear
            enterButton={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onSearch={(value) => handleFilterChange('search', value)}
          />
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="图片来源"
            allowClear
            style={{ width: '100%' }}
            value={filters.source}
            onChange={(value) => handleFilterChange('source', value)}
          >
            {sourceOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color} style={{ margin: 0 }}>
                  {option.label}
                </Tag>
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="处理状态"
            allowClear
            style={{ width: '100%' }}
            value={filters.processStatus}
            onChange={(value) => handleFilterChange('processStatus', value)}
          >
            {processStatusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color} style={{ margin: 0 }}>
                  {option.label}
                </Tag>
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="排序方式"
            style={{ width: '100%' }}
            value={`${filters.sort}-${filters.order}`}
            onChange={(value) => {
              const [sort, order] = value.split('-');
              handleFilterChange('sort', sort);
              handleFilterChange('order', order);
            }}
          >
            <Option value="createdAt-DESC">最新上传</Option>
            <Option value="createdAt-ASC">最早上传</Option>
            <Option value="size-DESC">文件最大</Option>
            <Option value="size-ASC">文件最小</Option>
            <Option value="filename-ASC">文件名A-Z</Option>
            <Option value="filename-DESC">文件名Z-A</Option>
          </Select>
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <Space>
            <Tag icon={<FilterOutlined />} color={activeFiltersCount > 0 ? 'blue' : 'default'}>
              {activeFiltersCount} 个筛选
            </Tag>
            {activeFiltersCount > 0 && (
              <Tag 
                icon={<ClearOutlined />} 
                color="red" 
                style={{ cursor: 'pointer' }}
                onClick={onClearFilters}
              >
                清除
              </Tag>
            )}
          </Space>
        </Col>
      </Row>
      
      {/* 统计信息 */}
      {stats.total > 0 && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space wrap>
              <Tag color="blue">总计: {stats.total}</Tag>
              {stats.upload > 0 && <Tag color="blue">上传: {stats.upload}</Tag>}
              {stats.ai_generated > 0 && <Tag color="purple">AI: {stats.ai_generated}</Tag>}
              {stats.crawler > 0 && <Tag color="orange">爬虫: {stats.crawler}</Tag>}
              {stats.processed > 0 && <Tag color="green">处理: {stats.processed}</Tag>}
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default ImageFilters;