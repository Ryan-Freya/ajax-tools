# MSW (Mock Service Worker) 使用说明

## 概述
本项目已集成 MSW，用于在开发环境中模拟网络请求，方便开发和测试。

## 功能特性
- ✅ 仅在开发环境 (`npm run dev`) 中启用
- ✅ 生产环境不受影响
- ✅ 提供多种预设的模拟API
- ✅ 支持自定义模拟数据
- ✅ 一键测试API功能

## 如何使用

### 1. 启动开发环境
```bash
npm run dev
```

### 2. 访问 uNetwork 页面
打开浏览器访问: `http://localhost:4001/uNetwork.html`

### 3. 触发测试API
- 点击页面上的 "🧪 测试API" 按钮
- 或者在浏览器控制台手动调用API

### 4. 查看网络请求
在开发者工具的Network面板中，可以看到被MSW拦截和模拟的请求。

## 预设的模拟API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users/:id` | GET | 获取特定用户 |
| `/api/products` | GET | 获取商品列表 |
| `/api/login` | POST | 模拟登录 |

## 自定义模拟数据

编辑 `src/mocks/handlers.ts` 文件来添加或修改模拟的API：

```typescript
import { rest } from 'msw'

export const handlers = [
  // 添加新的模拟API
  rest.get('/api/your-endpoint', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: '你的模拟数据' })
    )
  }),
]
```

## 文件结构
```
src/mocks/
├── handlers.ts    # API模拟处理器
└── browser.ts     # 浏览器worker设置

public/
└── mockServiceWorker.js  # MSW service worker文件
```

## 注意事项
- MSW只在开发环境中工作，不会影响生产构建
- 服务在页面加载时自动启动
- 控制台会显示MSW启动状态和API调用日志 