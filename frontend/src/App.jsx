import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/dashboard/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ImageLibraryPage from './pages/images/ImageLibraryPage';
import ImageProcessingPage from './pages/processing/ImageProcessingPage';
import AIGenerationPage from './pages/ai/AIGenerationPage';
import CrawlerPage from './pages/crawler/CrawlerPage';
import TagManagementPage from './pages/tags/TagManagementPage';
import SettingsPage from './pages/settings/SettingsPage';
import './styles/index.css';

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('ProtectedRoute - loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>正在检查登录状态...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// 公开路由组件（已登录用户重定向到首页）
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('PublicRoute - loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>正在检查登录状态...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="images" element={<ImageLibraryPage />} />
        <Route path="processing" element={<ImageProcessingPage />} />
        <Route path="ai" element={<AIGenerationPage />} />
        <Route path="crawler" element={<CrawlerPage />} />
        <Route path="tags" element={<TagManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;