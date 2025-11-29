import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  InputNumber, 
  Select, 
  message, 
  Row, 
  Col, 
  List, 
  Image, 
  Tag, 
  Progress,
  Divider,
  Space
} from 'antd';
import { 
  UploadOutlined, 
  ThunderboltOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { aiAPI } from '../../api/ai';
import './AIGenerationPage.less';

const { TextArea } = Input;
const { Option } = Select;

function AIGenerationPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [referenceImage, setReferenceImage] = useState(null);

  const handleGenerate = async (values) => {
    const { prefix = '', middle = '', suffix = '', count = 1, aspectRatio = '1:1' } = values;
    
    // Split middle part by newlines to get keywords
    const keywords = middle.split('\n').filter(k => k.trim());
    
    if (keywords.length === 0) {
      // If middle is empty, treat as single prompt if prefix/suffix exists
      if (prefix || suffix) {
        keywords.push('');
      } else {
        message.warning('请输入提示词');
        return;
      }
    }

    setLoading(true);
    setProgress(0);
    setGeneratedImages([]);

    const totalTasks = keywords.length * count;
    let completedTasks = 0;
    const newImages = [];

    try {
      // Process each keyword
      for (const keyword of keywords) {
        // Construct full prompt
        const promptParts = [prefix, keyword, suffix].filter(p => p && p.trim());
        const fullPrompt = promptParts.join(' ');
        
        // Generate 'count' images for this prompt
        for (let i = 0; i < count; i++) {
          try {
            const formData = new FormData();
            formData.append('prompt', fullPrompt);
            formData.append('keyword', keyword); // For tagging
            formData.append('aspectRatio', aspectRatio);
            if (referenceImage) {
              formData.append('image', referenceImage);
            }

            const res = await aiAPI.generateImage(formData);
            
            if (res.success && res.image) {
              newImages.push(res.image);
              setGeneratedImages(prev => [...prev, res.image]);
            }
          } catch (err) {
            console.error(`Generation failed for prompt: ${fullPrompt}`, err);
            message.error(`生成失败: ${fullPrompt.substring(0, 20)}...`);
          } finally {
            completedTasks++;
            setProgress(Math.round((completedTasks / totalTasks) * 100));
          }
        }
      }
      
      if (newImages.length > 0) {
        message.success(`成功生成 ${newImages.length} 张图片`);
      }
    } catch (error) {
      console.error('Batch generation error:', error);
      message.error('批量生成过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceUpload = (file) => {
    setReferenceImage(file);
    return false; // Prevent auto upload
  };

  return (
    <div className="ai-generation-page">
      <h1 className="page-title">AI 图片生成 (Gemini Flash)</h1>
      
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="生成配置" className="config-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                count: 1,
                aspectRatio: '1:1'
              }}
            >
              <Form.Item label="参考图片 (可选)">
                <Upload
                  beforeUpload={handleReferenceUpload}
                  onRemove={() => setReferenceImage(null)}
                  maxCount={1}
                  listType="picture-card"
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                </Upload>
              </Form.Item>

              <Divider orientation="left">提示词构建</Divider>
              
              <Form.Item name="prefix" label="前段提示词 (通用前缀)">
                <TextArea placeholder="例如: A high quality photo of..." autoSize={{ minRows: 2, maxRows: 4 }} />
              </Form.Item>

              <Form.Item 
                name="middle" 
                label="中段关键词 (每行一个，批量生成)"
                tooltip="每一行将作为一个独立的生成任务。例如输入3行，将生成3组图片。"
                rules={[{ required: true, message: '请输入至少一个关键词' }]}
              >
                <TextArea 
                  placeholder="例如:\nred apple\ngreen banana\nblue berry" 
                  autoSize={{ minRows: 6, maxRows: 12 }} 
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item name="suffix" label="后段提示词 (通用后缀)">
                <TextArea placeholder="例如: ...4k resolution, cinematic lighting" autoSize={{ minRows: 2, maxRows: 4 }} />
              </Form.Item>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="count" label="每词生成数量">
                    <InputNumber min={1} max={4} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="aspectRatio" label="图片比例">
                    <Select>
                      <Option value="1:1">1:1 (正方形)</Option>
                      <Option value="4:3">4:3</Option>
                      <Option value="3:4">3:4</Option>
                      <Option value="16:9">16:9 (宽屏)</Option>
                      <Option value="9:16">9:16 (竖屏)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<ThunderboltOutlined />} 
                  loading={loading}
                  block
                  size="large"
                >
                  {loading ? '正在生成中...' : '开始批量生成'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} lg={14}>
          <Card title="生成结果" className="result-card">
            {loading && (
              <div style={{ marginBottom: 20 }}>
                <Progress percent={progress} status="active" />
                <div style={{ textAlign: 'center', marginTop: 8 }}>正在调用 Gemini API 生成图片...</div>
              </div>
            )}
            
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
              dataSource={generatedImages}
              locale={{ emptyText: '暂无生成记录' }}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <Image
                        alt={item.filename}
                        src={item.url}
                        fallback="https://via.placeholder.com/300?text=Error"
                      />
                    }
                    actions={[
                      <Button type="text" icon={<SaveOutlined />} key="save" title="已自动保存" disabled />,
                      <Tag color="blue">{item.width}x{item.height}</Tag>
                    ]}
                  >
                    <Card.Meta
                      title={<span title={item.originalName} style={{fontSize: 12}}>{item.originalName}</span>}
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <div style={{ fontSize: 12, color: '#999' }}>{new Date(item.createdAt).toLocaleTimeString()}</div>
                          <div style={{ marginTop: 4 }}>
                            {item.tags && item.tags.map(tag => (
                              <Tag key={tag} style={{ fontSize: 10, marginRight: 4 }}>{tag}</Tag>
                            ))}
                          </div>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AIGenerationPage;
