import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 设置 MSW worker
export const worker = setupWorker(...handlers) 