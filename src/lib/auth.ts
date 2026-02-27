const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  id: string;
  walletAddress?: string | null;
  email?: string | null;
  usdtBalance: string;
  hlAddress?: string | null;
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

export async function bindHLAddress(hlAddress: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/user/bindhl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ hlAddress }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '绑定失败');
  }
}

export async function followStrategy(strategyId: string, amount: number): Promise<any> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/copytrade/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ strategyId, amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '跟单失败');
  }

  return response.json();
}

export async function getCopyPositions(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/copytrade/positions`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to get positions');
  return response.json();
}

export async function getStrategyPositions(strategyId: string): Promise<any> {
  const response = await fetch(`${API_URL}/strategy/${strategyId}/positions`);
  if (!response.ok) throw new Error('Failed to get strategy positions');
  return response.json();
}

// Token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mirror_token');
}

export function setToken(token: string): void {
  localStorage.setItem('mirror_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('mirror_token');
  localStorage.removeItem('mirror_user');
}

export function setUser(user: User): void {
  localStorage.setItem('mirror_user', JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('mirror_user');
  return userStr ? JSON.parse(userStr) : null;
}

export async function getCurrentUser(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to get current user');
  return response.json();
}
