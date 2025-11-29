import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Tabs, 
  Form, 
  InputNumber, 
  Select, 
  message, 
  Image, 
  Spin, 
  Modal, 
  List, 
  Avatar,
  Divider,
  Upload
} from 'antd';
import { 
  ScissorOutlined, 
  PictureOutlined, 
  ColumnWidthOutlined, 
  PlusOutlined,
  HistoryOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { imageProcessingAPI } from '../../api/imageProcessing';
import { imagesAPI } from '../../api/images';
import './ImageProcessingPage.less';

const { TabPane } = Tabs;
const { Option } = Select;

// Helper to get correct image URL
const getImageUrl = (image) => {
  if (!image) return '';
  if (image.url) return image.url;
  if (image.path) {
    if (image.path.startsWith('http')) return image.path;
    // Normalize path separators
    const normalizedPath = image.path.replace(/\\/g, '/');
    // If path already starts with uploads/, just add leading slash
    if (normalizedPath.startsWith('uploads/')) {
      return `/${normalizedPath}`;
    }
    return `/uploads/${normalizedPath}`;
  }
  return '';
};

function ImageProcessingPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageSelectorVisible, setImageSelectorVisible] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [imageListLoading, setImageListLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [uploading, setUploading] = useState(false);

  // Fetch images for selector
  const fetchImages = async (page = 1) => {
    setImageListLoading(true);
    try {
      const res = await imagesAPI.getImages({ page, limit: 10 });
      if (res && res.images) {
        setImageList(res.images || []);
        setPagination({
          current: page,
          pageSize: 10,
          total: res.pagination?.total || 0
        });
      }
    } catch (error) {
      message.error('获取图片列表失败');
    } finally {
      setImageListLoading(false);
    }
  };

  useEffect(() => {
    if (imageSelectorVisible) {
      fetchImages(1);
    }
  }, [imageSelectorVisible]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setProcessedImage(null); // Reset processed image
    setImageSelectorVisible(false);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const res = await imagesAPI.uploadImage(formData);
      message.success('上传成功');
      // Refresh list and select the new image
      await fetchImages(1);
      // If the API returns the new image object, select it
      if (res) {
        // Construct a full image object similar to what getImages returns
        const newImage = {
          ...res,
          path: res.url ? res.url.replace('/uploads/', '') : res.filename // Adjust path if needed
        };
        // Or just use the returned data if it matches
        handleImageSelect(newImage);
      }
    } catch (error) {
      message.error('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  // Process Handlers
  const handleRemoveBackground = async () => {
    if (!selectedImage) return message.warning('请先选择图片');
    setLoading(true);
    try {
      const res = await imageProcessingAPI.removeBackground(selectedImage.id);
      message.success('背景移除成功');
      setProcessedImage(res.processedImage); // Assuming API returns the new image object
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScene = async (values) => {
    if (!selectedImage) return message.warning('请先选择图片');
    setLoading(true);
    
    // Map style to colors
    const styleColors = {
      studio: ['#ffffff', '#f0f0f0'],
      outdoor: ['#87CEEB', '#E0F7FA'],
      home: ['#FFF3E0', '#FFE0B2'],
      office: ['#ECEFF1', '#CFD8DC']
    };

    const payload = {
      ...values,
      colors: styleColors[values.prompt] || ['#f0f8ff', '#e6f3ff']
    };

    try {
      const res = await imageProcessingAPI.generateScene(selectedImage.id, payload);
      message.success('场景生成成功');
      setProcessedImage(res.processedImage);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async (values) => {
    if (!selectedImage) return message.warning('请先选择图片');
    setLoading(true);
    try {
      const res = await imageProcessingAPI.resize(selectedImage.id, values);
      message.success('尺寸调整成功');
      setProcessedImage(res.processedImage);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-processing-page">
      <div className="page-header">
        <h1 className="page-title">图片处理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setImageSelectorVisible(true)}
        >
          选择图片
        </Button>
      </div>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={16}>
          <Card title="预览区域" className="preview-card">
            <Row gutter={16}>
              <Col span={12}>
                <div className="image-preview-container">
                  <div className="preview-label">原图</div>
                  {selectedImage ? (
                    <Image
                      src={getImageUrl(selectedImage)}
                      alt="Original"
                      style={{ maxHeight: 400, objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="empty-placeholder">请选择图片</div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <div className="image-preview-container">
                  <div className="preview-label">处理后</div>
                  <Spin spinning={loading}>
                    {processedImage ? (
                      <Image
                        src={getImageUrl(processedImage)}
                        alt="Processed"
                        style={{ maxHeight: 400, objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="empty-placeholder">等待处理...</div>
                    )}
                  </Spin>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="处理选项" className="options-card">
            <Tabs defaultActiveKey="1">
              <TabPane 
                tab={<span><ScissorOutlined />去背景</span>} 
                key="1"
              >
                <div className="tab-content">
                  <p>自动识别并移除图片背景，生成透明背景图片。</p>
                  <Button 
                    type="primary" 
                    block 
                    onClick={handleRemoveBackground}
                    loading={loading}
                    disabled={!selectedImage}
                  >
                    开始处理
                  </Button>
                </div>
              </TabPane>
              
              <TabPane 
                tab={<span><PictureOutlined />场景生成</span>} 
                key="2"
              >
                <Form layout="vertical" onFinish={handleGenerateScene}>
                  <Form.Item name="prompt" label="场景描述" rules={[{ required: true }]}>
                    <Select placeholder="选择场景风格">
                      <Option value="studio">专业摄影棚</Option>
                      <Option value="outdoor">户外自然</Option>
                      <Option value="home">家居环境</Option>
                      <Option value="office">办公环境</Option>
                    </Select>
                  </Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading}
                    disabled={!selectedImage}
                  >
                    生成场景
                  </Button>
                </Form>
              </TabPane>
              
              <TabPane 
                tab={<span><ColumnWidthOutlined />调整尺寸</span>} 
                key="3"
              >
                <Form layout="vertical" onFinish={handleResize} initialValues={{ width: 800, height: 800 }}>
                  <Form.Item name="width" label="宽度 (px)" rules={[{ required: true }]}>
                    <InputNumber min={1} max={4000} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="height" label="高度 (px)" rules={[{ required: true }]}>
                    <InputNumber min={1} max={4000} style={{ width: '100%' }} />
                  </Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading}
                    disabled={!selectedImage}
                  >
                    调整尺寸
                  </Button>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      <Modal
        title="选择图片"
        open={imageSelectorVisible}
        onCancel={() => setImageSelectorVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Upload 
            beforeUpload={handleUpload} 
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={uploading} type="primary">
              上传本地图片
            </Button>
          </Upload>
        </div>
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={imageList}
          loading={imageListLoading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchImages(page),
            size: 'small'
          }}
          renderItem={item => (
            <List.Item>
              <Card 
                hoverable 
                cover={
                  <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                    <img 
                      alt={item.filename} 
                      src={getImageUrl(item)} 
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                }
                onClick={() => handleImageSelect(item)}
                bodyStyle={{ padding: 12 }}
              >
                <Card.Meta 
                  title={item.filename} 
                  description={<span style={{ fontSize: 12 }}>{item.width}x{item.height}</span>} 
                />
              </Card>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}

export default ImageProcessingPage;