import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  PictureOutlined, 
  ToolOutlined, 
  CloudDownloadOutlined, 
  TagsOutlined, 
  SettingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './Sider.less';

const { Sider } = Layout;

function AppSider() {
  return (
    <Sider width={220} className="app-sider">
      <div className="logo">图片管理</div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        items={[
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/">仪表盘</Link>,
          },
          {
            key: 'images',
            icon: <PictureOutlined />,
            label: <Link to="/images">图片库</Link>,
          },
          {
            key: 'processing',
            icon: <ToolOutlined />,
            label: <Link to="/processing">图片处理</Link>,
          },
          {
            key: 'ai',
            icon: <ThunderboltOutlined />,
            label: <Link to="/ai">AI生成</Link>,
          },
          {
            key: 'crawler',
            icon: <CloudDownloadOutlined />,
            label: <Link to="/crawler">图片爬取</Link>,
          },
          {
            key: 'tags',
            icon: <TagsOutlined />,
            label: <Link to="/tags">标签管理</Link>,
          },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: <Link to="/settings">系统设置</Link>,
          },
        ]}
      />
    </Sider>
  );
}

export default AppSider;