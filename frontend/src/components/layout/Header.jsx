import React from 'react';
import { Layout, Dropdown, Avatar, Badge, message } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.less';

const { Header } = Layout;

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout();
        message.success('已退出登录');
        break;
      default:
        break;
    }
  };

  return (
    <Header className="app-header">
      <div className="header-left">
        <span className="logo">产品图片管理系统</span>
      </div>
      <div className="header-right">
        <Badge count={0} className="notification-badge">
          <BellOutlined className="notification-icon" />
        </Badge>
        <Dropdown
          menu={{
            items: [
              { 
                key: 'settings', 
                label: '系统设置',
                icon: <SettingOutlined />
              },
              { type: 'divider' },
              { 
                key: 'logout', 
                label: '退出登录',
                icon: <LogoutOutlined />
              },
            ],
            onClick: handleMenuClick,
          }}
          placement="bottomRight"
        >
          <div className="user-info">
            <Avatar icon={<UserOutlined />} className="user-avatar" />
            <span className="username">{user?.username || '用户'}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}

export default AppHeader;