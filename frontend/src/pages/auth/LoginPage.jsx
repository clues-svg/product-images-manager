import React, { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Page.less';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login({
        email: values.email,
        password: values.password
      });
      
      if (result.success) {
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Card className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">产品图片管理系统</h1>
            <p className="auth-subtitle">登录您的账户</p>
          </div>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱!' },
                { type: 'email', message: '请输入有效的邮箱地址!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="邮箱地址" 
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item>
              <div className="auth-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" className="auth-link">
                  忘记密码？
                </Link>
              </div>
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                size="large"
              >
                登录
              </Button>
            </Form.Item>
            <div className="auth-footer">
              还没有账户？ <Link to="/register" className="auth-link">立即注册</Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;