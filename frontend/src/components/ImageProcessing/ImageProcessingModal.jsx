import React, { useState } from 'react';
import { Modal, Tabs, Button, Form, InputNumber, Select, Upload, message, Space, Divider } from 'antd';
import { UploadOutlined, BgColorsOutlined, ScissorOutlined } from '@ant-design/icons';
import { imageProcessingAPI } from '../../api/imageProcessing';
import '../../styles/ImageProcessing.css';

const { TabPane } = Tabs;
const { Option } = Select;

// Fallback ColorPicker since current antd version might not support it
const ColorPicker = ({ value, onChange, defaultValue }) => (
  <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <input 
      type="color" 
      value={typeof value === 'string' ? value : (value?.toHexString?.() || defaultValue || '#000000')} 
      onChange={(e) => onChange({ toHexString: () => e.target.value })}
      style={{ width: 32, height: 32, padding: 0, border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' }}
    />
  </div>
);

const ImageProcessingModal = ({ visible, onCancel, onSuccess, selectedImage }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('removeBackground');
  const [form] = Form.useForm();

  // 去背景处理
  const handleRemoveBackground = async (values) => {
    try {
      setLoading(true);
      const result = await imageProcessingAPI.removeBackground(selectedImage.id, values);
      
      if (result.success) {
        message.success('背景去除成功！');
        onSuccess(result.processedImage);
        onCancel();
      } else {
        message.error('背景去除失败');
      }
    } catch (error) {
      console.error('背景去除错误:', error);
      message.error(error.message || '背景去除失败');
    } finally {
      setLoading(false);
    }
  };

  // 场景生成处理
  const handleGenerateScene = async (values) => {
    try {
      setLoading(true);
      const result = await imageProcessingAPI.generateScene(selectedImage.id, values);
      
      if (result.success) {
        message.success('场景生成成功！');
        onSuccess(result.processedImage);
        onCancel();
      } else {
        message.error('场景生成失败');
      }
    } catch (error) {
      console.error('场景生成错误:', error);
      message.error(error.message || '场景生成失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    if (activeTab === 'removeBackground') {
      handleRemoveBackground(values);
    } else {
      handleGenerateScene(values);
    }
  };

  return (
    <Modal
      title="图片处理"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      {selectedImage && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <img 
              src={`http://localhost:3000/uploads/${selectedImage.filename}`}
              alt={selectedImage.originalName}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, marginRight: 12 }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{selectedImage.originalName}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {selectedImage.width}×{selectedImage.height} • {Math.round(selectedImage.size / 1024)}KB
              </div>
            </div>
          </div>
          <Divider />
        </div>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <ScissorOutlined />
              去背景
            </span>
          } 
          key="removeBackground"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              tolerance: 30,
              size: 'auto'
            }}
          >
            <Form.Item
              label="容差值"
              name="tolerance"
              help="数值越大，去除的背景范围越大（0-100）"
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                placeholder="背景去除的容差值"
              />
            </Form.Item>

            <Form.Item
              label="输出尺寸"
              name="size"
            >
              <Select placeholder="选择输出尺寸">
                <Option value="auto">自动</Option>
                <Option value="preview">预览（0.25x）</Option>
                <Option value="small">小图（0.4x）</Option>
                <Option value="regular">常规（1x）</Option>
                <Option value="medium">中图（1.5x）</Option>
                <Option value="large">大图（2x）</Option>
              </Select>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button onClick={onCancel}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<ScissorOutlined />}
                >
                  开始去背景
                </Button>
              </Space>
            </div>
          </Form>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BgColorsOutlined />
              生成场景
            </span>
          } 
          key="generateScene"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              sceneType: 'ai_generated',
              width: 1200,
              height: 1200,
              colors: ['#f0f8ff', '#e6f3ff'],
              quality: 90,
              blend: 'over'
            }}
          >
            <Form.Item
              label="场景类型"
              name="sceneType"
            >
              <Select placeholder="选择场景生成类型">
                <Option value="ai_generated">AI生成场景</Option>
                <Option value="blend_scene">场景图融合</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="输出尺寸"
            >
              <Space>
                <Form.Item name="width" noStyle>
                  <InputNumber
                    placeholder="宽度"
                    min={400}
                    max={2400}
                    style={{ width: 120 }}
                  />
                </Form.Item>
                <span>×</span>
                <Form.Item name="height" noStyle>
                  <InputNumber
                    placeholder="高度"
                    min={400}
                    max={2400}
                    style={{ width: 120 }}
                  />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item
              label="背景颜色"
              name="colors"
              help="选择渐变背景的起始和结束颜色"
            >
              <Space>
                <ColorPicker 
                  defaultValue="#f0f8ff"
                  onChange={(color) => {
                    const colors = form.getFieldValue('colors') || [];
                    colors[0] = color.toHexString();
                    form.setFieldValue('colors', colors);
                  }}
                />
                <span>到</span>
                <ColorPicker 
                  defaultValue="#e6f3ff"
                  onChange={(color) => {
                    const colors = form.getFieldValue('colors') || [];
                    colors[1] = color.toHexString();
                    form.setFieldValue('colors', colors);
                  }}
                />
              </Space>
            </Form.Item>

            <Form.Item
              label="图片质量"
              name="quality"
            >
              <InputNumber
                min={50}
                max={100}
                style={{ width: '100%' }}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
            </Form.Item>

            <Form.Item
              label="混合模式"
              name="blend"
            >
              <Select placeholder="选择混合模式">
                <Option value="over">覆盖</Option>
                <Option value="multiply">正片叠底</Option>
                <Option value="screen">滤色</Option>
                <Option value="overlay">叠加</Option>
                <Option value="soft-light">柔光</Option>
              </Select>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button onClick={onCancel}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<BgColorsOutlined />}
                >
                  生成场景
                </Button>
              </Space>
            </div>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ImageProcessingModal;