import {
  Order,
  ProcessPaymentInput,
  DashboardMetrics,
  Product,
  CreateOrderInput,
  User,
  UserAuthResponse
} from '../types';

function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('barpos_api_url');
    if (custom && custom.trim() !== '') {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Running inside Electron desktop application via file:// protocol
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://localhost:4000/api/v1';
  }

  return '/api/v1';
}

export const API_BASE = resolveApiBase();

export function setCustomApiUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem('barpos_api_url');
  } else {
    localStorage.setItem('barpos_api_url', url.trim().replace(/\/+$/, ''));
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('barpos_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('barpos_token', token);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('barpos_user');
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user: User): void {
  localStorage.setItem('barpos_user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('barpos_token');
  localStorage.removeItem('barpos_user');
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginCashier(username: string, password: string): Promise<UserAuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed. Please check credentials.');
  }

  const json = await res.json();
  setStoredToken(json.data.token);
  setStoredUser(json.data.user);
  return json.data;
}

export async function fetchOrders(status?: string, search?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
    headers: getHeaders()
  });

  if (res.status === 401 || res.status === 403) {
    clearSession();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to connect to the POS server.');
  }

  const json = await res.json();
  return json.data;
}

export async function searchOrderByRef(reference: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/ref/${encodeURIComponent(reference.trim())}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `No order found with reference "${reference}".`);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchOrderById(id: number): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Order details not found.');
  }

  const json = await res.json();
  return json.data;
}

export async function processOrderPayment(input: ProcessPaymentInput): Promise<any> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to process payment.');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchReceiptData(orderId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/payments/receipt/${orderId}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Receipt data not found.');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/sales/metrics`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to load metrics.');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to load products.');
  }

  const json = await res.json();
  return json.data;
}

export async function createDirectOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create order.');
  }

  const json = await res.json();
  return json.data;
}

export async function cancelOrder(orderId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to cancel order.');
  }
}
