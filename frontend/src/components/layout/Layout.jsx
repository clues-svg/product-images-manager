import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sider from './Sider';
import './Layout.less';

const { Content } = Layout;

function AppLayout() {
  return (
    <Layout className="app-layout">
      <Sider />
      <Layout>
        <Header />
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;