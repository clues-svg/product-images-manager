import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs } from 'antd';
import { SaveOutlined, KeyOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';
import './SettingsPage.less';

const { TabPane } = Tabs;

function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.success) {
        form.setFieldsValue(res.data);
      }
    } catch (error) {
      message.error('获取设置失败');
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/settings', values);
      if (res.success) {
        message.success('设置保存成功');
      } else {
        message.error('保存失败');
      }
    } catch (error) {
      message.error('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">系统设置</h1>
      
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab={<span><KeyOutlined />API 配置</span>} key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                name="geminiApiKey"
                label="Gemini API Key"
                tooltip="用于 AI 图片生成功能的 API 密钥"
                rules={[{ required: true, message: '请输入 API Key' }]}
              >
                <Input.Password placeholder="请输入您的 Gemini API Key" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default SettingsPage;