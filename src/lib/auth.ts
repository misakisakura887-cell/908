import { ethers } from 'ethers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  id: string;
  walletAddress?: string | null;
  email?: string | null;
  usdtBalance: string;
}

export async function getNonce(walletAddress: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    throw new Error('Failed to get nonce');
  }

  const data = await response.json();
  return data.message;
}

export async function walletLogin(
  walletAddress: string,
  message: string,
  signature: string
): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_URL}/auth/wallet-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, message, signature }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function signMessage(message: string): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.signMessage(message);
}

// 从 localStorage 获取 token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mirror_token');
}

// 存储 token
export function setToken(token: string): void {
  localStorage.setItem('mirror_token', token);
}

// 清除 token
export function clearToken(): void {
  localStorage.removeItem('mirror_token');
  localStorage.removeItem('mirror_user');
}

// 存储用户信息
export function setUser(user: User): void {
  localStorage.setItem('mirror_user', JSON.stringify(user));
}

// 获取用户信息
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('mirror_user');
  return userStr ? JSON.parse(userStr) : null;
}

// 获取当前用户（从 API）
export async function getCurrentUser(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return response.json();
}
