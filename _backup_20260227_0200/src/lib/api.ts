const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.2.108:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // 认证
  async getNonce(walletAddress: string) {
    return this.request('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verify(walletAddress: string, signature: string) {
    const data = await this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  // 策略
  async getStrategies(params?: { type?: string; riskLevel?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/strategies?${query}`);
  }

  async getStrategy(id: string) {
    return this.request(`/api/strategies/${id}`);
  }

  // 用户仓位
  async getMyPositions() {
    return this.request('/api/positions');
  }

  async invest(strategyId: string, amount: number) {
    return this.request('/api/positions', {
      method: 'POST',
      body: JSON.stringify({ strategyId, amount }),
    });
  }

  async withdraw(positionId: string, amount?: number) {
    return this.request(`/api/positions/${positionId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

export const api = new ApiClient();
