import { http, HttpResponse } from 'msw';

export const handlers = [
  // 模拟用户API
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' }
    ])
  }),

  // 模拟商品列表
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '10'
    
    return HttpResponse.json({
      data: Array.from({ length: Number(limit) }, (_, i) => ({
        id: i + 1,
        name: `商品${i + 1}`,
        price: Math.floor(Math.random() * 1000) + 100
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 100
      }
    })
  }),

  // 模拟获取特定用户
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id: Number(id),
      name: `用户${id}`,
      email: `user${id}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      createdAt: new Date().toISOString()
    })
  }),

  // 模拟登录
  http.post('/api/login', async ({ request }) => {
    const body = await request.json()
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return HttpResponse.json({
      token: 'mock-token-' + Date.now(),
      user: { 
        id: 1, 
        username: body.username || 'admin',
        role: 'administrator'
      }
    })
  })
]