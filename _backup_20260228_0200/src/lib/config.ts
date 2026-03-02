/**
 * 应用配置
 * 使用环境变量或默认值
 */

// API 基础 URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.2.108:3001/api';

// WebSocket URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.2.108:3001';

// 是否为开发环境
export const isDev = process.env.NODE_ENV === 'development';

// 是否为生产环境
export const isProd = process.env.NODE_ENV === 'production';
