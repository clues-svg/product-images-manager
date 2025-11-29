import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Upload, 
  Button, 
  Input, 
  Select, 
  Pagination, 
  Image, 
  Tag, 
  Modal, 
  message,
  Spin,
  Empty,
  Checkbox,
  Space
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  TagsOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { imagesAPI } from '../../api/images';
import { tagsAPI } from '../../api/tags';
import AdvancedImageFilters from '../../components/images/AdvancedImageFilters';
import ImageProcessingModal from '../../components/ImageProcessing/ImageProcessingModal';
import '../../styles/ImageLibrary.css';

const { Search } = Input;
const { Option } = Select;

function ImageLibraryPage() {
  const location = useLocation();
  const [filters, setFilters] = useState({
    search: '',
    tags: [],
    tagLogic: 'and',
    sourceFilter: [],
    aspectRatio: '',
    sort: 'createdAt',
    order: 'DESC'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedImages, setSelectedImages] = useState([]);
  const [processingModalVisible, setProcessingModalVisible] = useState(false);
  const [selectedImageForProcessing, setSelectedImageForProcessing] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [editTagsVisible, setEditTagsVisible] = useState(false);
  const [currentEditImage, setCurrentEditImage] = useState(null);
  const [editingTags, setEditingTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [batchTags, setBatchTags] = useState([]);
  const [batchTagsVisible, setBatchTagsVisible] = useState(false);
  const [batchSelectedImages, setBatchSelectedImages] = useState([]);
  const [uploadTagsVisible, setUploadTagsVisible] = useState(false);
  const [uploadTags, setUploadTags] = useState([]);
  const [topTags, setTopTags] = useState([]);

  const queryClient = useQueryClient();

  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagsParam = params.get('tags');
    
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(t => t.trim());
      if (tags.length > 0) {
        setFilters(prev => ({
          ...prev,
          tags: tags
        }));
      }
    }
  }, [location.search]);

  // 获取热门标签
  useEffect(() => {
    const fetchTopTags = async () => {
      try {
        const response = await tagsAPI.getTags({
          sort: 'count',
          order: 'DESC',
          limit: 20
        });
        // 兼容不同的响应结构
        const tags = response.data?.tags || response.tags || [];
        setTopTags(tags);
      } catch (error) {
        console.error('获取热门标签失败:', error);
      }
    };
    fetchTopTags();
  }, []);

  // 监控 filters 状态变化
  useEffect(() => {
    console.log('ImageLibraryPage - filters 状态变化:', filters);
    console.log('ImageLibraryPage - filters.tags:', filters.tags);
  }, [filters]);

  // 获取可用标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await tagsAPI.getTags();
        setAvailableTags(response.tags || []);
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    fetchTags();
  }, []);

  // 获取图片列表
  const { data: imagesData, isLoading, error } = useQuery(
    ['images', currentPage, pageSize, filters],
    () => imagesAPI.getImages({
      page: currentPage,
      limit: pageSize,
      ...filters
    }),
    {
      keepPreviousData: true,
    }
  );

  // 删除图片
  const deleteMutation = useMutation(imagesAPI.deleteImage, {
    onSuccess: () => {
      message.success('图片删除成功');
      queryClient.invalidateQueries(['images']);
      setSelectedImages([]);
    },
    onError: (error) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 上传图片
  const uploadProps = {
    name: 'image',
    action: '/api/v1/images',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: (file) => {
      console.log('上传文件 - 设置的标签:', uploadTags);
      return uploadTags.length > 0 ? { tags: JSON.stringify(uploadTags) } : {};
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        queryClient.invalidateQueries(['images']);
        if (info.fileList.every(file => file.status === 'done' || file.status === 'error')) {
          setUploadVisible(false);
          setUploadTags([]);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const handleFiltersChange = (newFilters) => {
    console.log('ImageLibraryPage - handleFiltersChange 被调用');
    console.log('ImageLibraryPage - 当前filters:', filters);
    console.log('ImageLibraryPage - 新filters:', newFilters);
    
    // 创建一个全新的对象，确保引用发生变化
    const updatedFilters = {
      ...newFilters,
      // 确保数组也是新的引用
      tags: [...(newFilters.tags || [])],
      sourceFilter: [...(newFilters.sourceFilter || [])]
    };
    
    console.log('ImageLibraryPage - 更新后的filters:', updatedFilters);
    setFilters(updatedFilters);
    setCurrentPage(1);
    console.log('ImageLibraryPage - setFilters 已调用');
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      tags: [],
      tagLogic: 'and',
      sourceFilter: [],
      aspectRatio: '',
      sort: 'createdAt',
      order: 'DESC'
    });
    setCurrentPage(1);
  };

  const handleDelete = (imageId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(imageId),
    });
  };

  const handlePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // 编辑标签
  const handleEditTags = (image) => {
    console.log('编辑标签 - 原始图片数据:', image);
    console.log('编辑标签 - 图片标签:', image.tags);
    setCurrentEditImage(image);
    setEditingTags(image.tags || []);
    setEditTagsVisible(true);
  };

  // 保存标签
  const handleSaveTags = async () => {
    if (!currentEditImage) return;
    
    console.log('保存标签 - 当前编辑图片:', currentEditImage);
    console.log('保存标签 - 编辑中的标签:', editingTags);
    console.log('保存标签 - 标签类型:', typeof editingTags);
    console.log('保存标签 - 是否为数组:', Array.isArray(editingTags));
    
    try {
      const updateData = {
        tags: editingTags
      };
      console.log('保存标签 - 发送的数据:', updateData);
      
      await imagesAPI.updateImage(currentEditImage.id, updateData);
      
      message.success('标签更新成功');
      setEditTagsVisible(false);
      setCurrentEditImage(null);
      setEditingTags([]);
      
      // 刷新图片列表
      queryClient.invalidateQueries(['images']);
    } catch (error) {
      console.error('更新标签失败:', error);
      message.error('标签更新失败');
    }
  };

  // 添加新标签
  const handleAddTag = (tagName) => {
    if (tagName && !editingTags.includes(tagName)) {
      setEditingTags([...editingTags, tagName]);
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  // 批量选择图片
  const handleImageSelect = (imageId, selected) => {
    if (selected) {
      setBatchSelectedImages([...batchSelectedImages, imageId]);
    } else {
      setBatchSelectedImages(batchSelectedImages.filter(id => id !== imageId));
    }
  };

  // 批量添加标签
  const handleBatchAddTags = async () => {
    if (batchSelectedImages.length === 0) {
      message.warning('请先选择要添加标签的图片');
      return;
    }

    if (batchTags.length === 0) {
      message.warning('请先选择要添加的标签');
      return;
    }

    console.log('批量添加标签 - 选中图片:', batchSelectedImages);
    console.log('批量添加标签 - 要添加的标签:', batchTags);

    try {
      // 批量更新图片标签
      const promises = batchSelectedImages.map(imageId => {
        const image = images.find(img => img.id === imageId);
        const existingTags = image?.tags || [];
        const newTags = [...new Set([...existingTags, ...batchTags])]; // 去重
        console.log(`图片${imageId} - 原有标签:`, existingTags, '新标签:', newTags);
        return imagesAPI.updateImage(imageId, { tags: newTags });
      });

      await Promise.all(promises);
      message.success(`成功为 ${batchSelectedImages.length} 张图片添加标签`);
      setBatchTagsVisible(false);
      setBatchSelectedImages([]);
      setBatchTags([]);
      queryClient.invalidateQueries(['images']);
    } catch (error) {
      console.error('批量添加标签失败:', error);
      message.error('批量添加标签失败');
    }
  };

  // 上传时设置标签
  const handleUploadWithTags = (tags) => {
    setUploadTags(tags);
    setUploadTagsVisible(false);
    setUploadVisible(true);
  };

  // 图片处理
  const handleImageProcessing = (image) => {
    setSelectedImageForProcessing(image);
    setProcessingModalVisible(true);
  };

  // 处理成功回调
  const handleProcessingSuccess = (processedImage) => {
    message.success('图片处理完成！');
    queryClient.invalidateQueries(['images']);
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">加载失败</div>
        <div className="error-message">{error.message}</div>
        <Button onClick={() => queryClient.invalidateQueries(['images'])}>
          重试
        </Button>
      </div>
    );
  }

  const images = imagesData?.images || [];
  const total = imagesData?.pagination?.total || 0;

  return (
    <div className="image-library-page">
      <div className="page-header">
        <h1 className="page-title">图片库</h1>
        <div className="page-actions">
          <Space>
            {batchSelectedImages.length > 0 && (
              <Button 
                icon={<TagsOutlined />}
                onClick={() => setBatchTagsVisible(true)}
              >
                批量添加标签 ({batchSelectedImages.length})
              </Button>
            )}
            <Button 
              icon={<TagsOutlined />}
              onClick={() => setUploadTagsVisible(true)}
            >
              上传并设置标签
            </Button>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              上传图片
            </Button>
          </Space>
        </div>
      </div>

      <AdvancedImageFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        stats={imagesData?.stats}
        users={[]} // TODO: 从API获取用户列表
        websites={[]} // TODO: 从API获取网站列表
        aiModels={[]} // TODO: 从API获取AI模型列表
      />

      {topTags.length > 0 && (
        <Card className="popular-tags-card" style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 'bold', marginRight: 8, display: 'flex', alignItems: 'center' }}>
              <FireOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
              热门标签:
            </span>
            {topTags.map(tag => (
              <Tag 
                key={tag.name} 
                color={filters.tags.includes(tag.name) ? "blue" : "default"}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (!filters.tags.includes(tag.name)) {
                    handleFiltersChange({
                      ...filters,
                      tags: [...filters.tags, tag.name]
                    });
                  } else {
                    // 如果已选中，则取消选中
                    handleFiltersChange({
                      ...filters,
                      tags: filters.tags.filter(t => t !== tag.name)
                    });
                  }
                }}
              >
                {tag.name} ({tag.count})
              </Tag>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : images.length === 0 ? (
          <Empty 
            description="暂无图片"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              上传第一张图片
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {images.map((image) => (
                <Col xs={12} sm={8} md={6} lg={4} xl={3} key={image.id}>
                  <div className="image-card">
                    <div className="image-selection">
                      <Checkbox
                        checked={batchSelectedImages.includes(image.id)}
                        onChange={(e) => handleImageSelect(image.id, e.target.checked)}
                      />
                    </div>
                    <div className="image-wrapper">
                      <Image
                        src={image.url}
                        alt={image.originalName || image.filename}
                        preview={false}
                        onClick={() => handlePreview(image.url)}
                      />
                      <div className="image-overlay">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(image.url)}
                        />
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={() => handleEditTags(image)}
                        />
                        <Button 
                          type="text" 
                          icon={<ScissorOutlined />}
                          title="去背景"
                          onClick={() => handleImageProcessing(image)}
                        />
                        <Button 
                          type="text" 
                          icon={<BgColorsOutlined />}
                          title="生成场景"
                          onClick={() => handleImageProcessing(image)}
                        />
                        <Button 
                          type="text" 
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(image.id)}
                        />
                      </div>
                    </div>
                    
                    {/* 图片标题 - 紧邻图片下方 */}
                    <div className="image-title" title={image.originalName || image.filename}>
                      {image.originalName || image.filename}
                    </div>
                    
                    {/* 图片元信息 */}
                    <div className="image-meta">
                      <div className="image-size-info">
                        <span>{(image.size / 1024).toFixed(1)} KB</span>
                        {image.width && image.height && (
                          <span> • {image.width}×{image.height}</span>
                        )}
                      </div>
                      
                      <div className="image-tags-row">
                        {/* 来源标签 */}
                        <Tag 
                          size="small" 
                          color={
                            image.source === 'upload' ? 'blue' :
                            image.source === 'ai_generated' ? 'purple' :
                            image.source === 'crawler' ? 'orange' : 'green'
                          }
                        >
                          {
                            image.source === 'upload' ? '上传' :
                            image.source === 'ai_generated' ? 'AI' :
                            image.source === 'crawler' ? '爬虫' : '处理'
                          }
                        </Tag>
                        
                        {/* 处理类型标签 */}
                        {image.processType !== 'original' && (
                          <Tag 
                            size="small" 
                            color={
                              image.processType === 'background_removed' ? 'red' :
                              image.processType === 'background_added' ? 'blue' :
                              image.processType === 'resized' ? 'orange' : 'purple'
                            }
                          >
                            {
                              image.processType === 'background_removed' ? '去背景' :
                              image.processType === 'background_added' ? '加背景' :
                              image.processType === 'resized' ? '调尺寸' : '转格式'
                            }
                          </Tag>
                        )}
                      </div>
                      
                      {/* 用户标签行 */}
                      {image.tags && image.tags.length > 0 && (
                        <div className="image-user-tags">
                          {image.tags.slice(0, 3).map((tag, index) => (
                            <Tag 
                              key={index} 
                              size="small"
                              color="default"
                              style={{ cursor: 'pointer', marginBottom: 2 }}
                              onClick={() => handleEditTags(image)}
                            >
                              {tag}
                            </Tag>
                          ))}
                          {image.tags.length > 3 && (
                            <Tag 
                              size="small"
                              color="default"
                              style={{ cursor: 'pointer', marginBottom: 2 }}
                              onClick={() => handleEditTags(image)}
                            >
                              +{image.tags.length - 3}
                            </Tag>
                          )}
                        </div>
                      )}
                      
                      {/* 如果没有标签，显示添加标签按钮 */}
                      {(!image.tags || image.tags.length === 0) && (
                        <div className="image-no-tags">
                          <Button 
                            type="link" 
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditTags(image)}
                            style={{ padding: 0, height: 'auto' }}
                          >
                            添加标签
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            
            <div className="pagination-wrapper">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
              />
            </div>
          </>
        )}
      </Card>

      {/* 图片预览 */}
      <Image
        width={200}
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />

      {/* 标签编辑对话框 */}
      <Modal
        title={`编辑标签 - ${currentEditImage?.originalName || currentEditImage?.filename}`}
        open={editTagsVisible}
        onOk={handleSaveTags}
        onCancel={() => {
          setEditTagsVisible(false);
          setCurrentEditImage(null);
          setEditingTags([]);
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>当前标签：</h4>
          <div style={{ marginBottom: 16 }}>
            {editingTags.map((tag, index) => (
              <Tag
                key={index}
                closable
                onClose={() => handleRemoveTag(tag)}
                style={{ marginBottom: 8 }}
              >
                {tag}
              </Tag>
            ))}
            {editingTags.length === 0 && (
              <span style={{ color: '#999' }}>暂无标签</span>
            )}
          </div>
        </div>
        
        <div>
          <h4>添加标签：</h4>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入新标签或从现有标签中选择"
            value={[]}
            onChange={(values) => {
              if (values.length > 0) {
                const newTag = values[values.length - 1];
                handleAddTag(newTag);
              }
            }}
            tokenSeparators={[',', ' ']}
          >
            {availableTags.map(tag => (
              <Option key={tag.name} value={tag.name}>
                {tag.name}
              </Option>
            ))}
          </Select>
          
          <div style={{ marginTop: 16 }}>
            <h4>常用标签：</h4>
            <div>
              {availableTags.slice(0, 10).map(tag => (
                <Tag
                  key={tag.name}
                  style={{ 
                    cursor: 'pointer', 
                    marginBottom: 8,
                    opacity: editingTags.includes(tag.name) ? 0.5 : 1
                  }}
                  onClick={() => handleAddTag(tag.name)}
                  disabled={editingTags.includes(tag.name)}
                >
                  {tag.name}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 批量添加标签对话框 */}
      <Modal
        title={`批量添加标签 - 已选择 ${batchSelectedImages.length} 张图片`}
        open={batchTagsVisible}
        onOk={handleBatchAddTags}
        onCancel={() => {
          setBatchTagsVisible(false);
          setBatchSelectedImages([]);
          setBatchTags([]);
        }}
        okText="添加标签"
        cancelText="取消"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>为选中的图片批量添加标签：</h4>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入标签，用逗号分隔，或从现有标签中选择"
            value={batchTags}
            onChange={setBatchTags}
            tokenSeparators={[',', ' ']}
          >
            {availableTags.map(tag => (
              <Option key={tag.name} value={tag.name}>
                {tag.name}
              </Option>
            ))}
          </Select>
          
          <div style={{ marginTop: 16 }}>
            <h4>常用标签：</h4>
            <div>
              {availableTags.slice(0, 10).map(tag => (
                <Tag
                  key={tag.name}
                  style={{ 
                    cursor: 'pointer', 
                    marginBottom: 8,
                    opacity: batchTags.includes(tag.name) ? 0.5 : 1
                  }}
                  onClick={() => {
                    if (!batchTags.includes(tag.name)) {
                      setBatchTags([...batchTags, tag.name]);
                    }
                  }}
                  disabled={batchTags.includes(tag.name)}
                >
                  {tag.name}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 上传并设置标签对话框 */}
      <Modal
        title="上传图片并设置标签"
        open={uploadTagsVisible}
        onOk={() => {
          handleUploadWithTags(uploadTags);
        }}
        onCancel={() => {
          setUploadTagsVisible(false);
          setUploadTags([]);
        }}
        okText="开始上传"
        cancelText="取消"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>为上传的图片设置标签：</h4>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入标签，用逗号分隔，或从现有标签中选择"
            value={uploadTags}
            onChange={setUploadTags}
            tokenSeparators={[',', ' ']}
          >
            {availableTags.map(tag => (
              <Option key={tag.name} value={tag.name}>
                {tag.name}
              </Option>
            ))}
          </Select>
          
          <div style={{ marginTop: 16 }}>
            <h4>常用标签：</h4>
            <div>
              {availableTags.slice(0, 10).map(tag => (
                <Tag
                  key={tag.name}
                  style={{ 
                    cursor: 'pointer', 
                    marginBottom: 8,
                    opacity: uploadTags.includes(tag.name) ? 0.5 : 1
                  }}
                  onClick={() => {
                    if (!uploadTags.includes(tag.name)) {
                      setUploadTags([...uploadTags, tag.name]);
                    }
                  }}
                  disabled={uploadTags.includes(tag.name)}
                >
                  {tag.name}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 上传对话框 */}
      <Modal
        title={uploadTags.length > 0 ? `上传图片 (将添加标签: ${uploadTags.join(', ')})` : "上传图片"}
        open={uploadVisible}
        onCancel={() => {
          setUploadVisible(false);
          setUploadTags([]);
        }}
        footer={null}
      >
        <Upload.Dragger {...uploadProps} multiple>
          <p className="ant-upload-drag-icon">
            <PlusOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传。支持 JPG、PNG、GIF 格式，单个文件不超过 10MB
            {uploadTags.length > 0 && (
              <><br />将自动为上传的图片添加标签: {uploadTags.join(', ')}</>
            )}
          </p>
        </Upload.Dragger>
      </Modal>

      {/* 图片处理对话框 */}
      <ImageProcessingModal
        visible={processingModalVisible}
        onCancel={() => {
          setProcessingModalVisible(false);
          setSelectedImageForProcessing(null);
        }}
        onSuccess={handleProcessingSuccess}
        selectedImage={selectedImageForProcessing}
      />
    </div>
  );
}

export default ImageLibraryPage;