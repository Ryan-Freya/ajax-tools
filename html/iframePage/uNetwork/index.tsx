import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 只在开发环境中启动MSW
if (process.env.NODE_ENV === 'development') {
  import('../src/mocks/browser').then(({ worker }) => {
    worker.start({
      onUnhandledRequest: 'bypass', // 对于未mock的请求，让其正常通过
    }).then(() => {
      console.log('🚀 MSW已启动，模拟数据现在可用');
      // MSW启动后再渲染应用
      ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
    });
  });
} else {
  // 生产环境直接渲染
  ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
}
