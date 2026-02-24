/**
 * 应用配置
 * 使用环境变量或默认值
 */

// API 基础 URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// WebSocket URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

// 是否为开发环境
export const isDev = process.env.NODE_ENV === 'development';

// 是否为生产环境
export const isProd = process.env.NODE_ENV === 'production';
