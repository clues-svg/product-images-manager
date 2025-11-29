import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('Application starting...');

// 简单的加载指示器
const Loading = () => <div style={{ padding: 20 }}>正在初始化应用...</div>;

root.render(
  <ErrorBoundary>
    <React.Suspense fallback={<Loading />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.Suspense>
  </ErrorBoundary>
);