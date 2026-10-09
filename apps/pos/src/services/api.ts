import {
  Order,
  ProcessPaymentInput,
  DashboardMetrics,
  Product,
  CreateOrderInput,
  User,
  UserAuthResponse
} from '../types';
import { fetchWithTimeout } from '../../../../shared/http';

function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('barpos_api_url');
    if (custom && custom.trim() !== '') return custom.trim().replace(/\/+$/, '');
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl.trim().replace(/\/+$/, '');

  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://localhost:4000/api/v1';
  }

  return '/api/v1';
}

export const API_BASE = resolveApiBase();
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

export function setCustomApiUrl(url: string): void {
  if (!url || url.trim() === '') localStorage.removeItem('barpos_api_url');
  else localStorage.setItem('barpos_api_url', url.trim().replace(/\/+$/, ''));
}

export function getStoredToken(): string | null {
  return localStorage.getItem('barpos_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('barpos_token', token);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('barpos_user');
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('barpos_user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('barpos_token');
  localStorage.removeItem('barpos_user');
}

export function getSessionMessage(): string | null {
  return localStorage.getItem('barpos_session_message');
}

export function clearSessionMessage(): void {
  localStorage.removeItem('barpos_session_message');
}

export function expireSession(): void {
  clearSession();
  localStorage.setItem('barpos_session_message', SESSION_EXPIRED_MESSAGE);
  if (typeof window !== 'undefined') window.location.hash = '#/login';
}

function handleUnauthorized(): never {
  expireSession();
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
const isNumeric = (value: unknown): boolean =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));

const isOrder = (value: unknown): value is Order =>
  isRecord(value) && typeof value.id === 'number' && typeof value.reference_no === 'string' &&
  isNumeric(value.total) && (!('items' in value) || Array.isArray(value.items));
const isProduct = (value: unknown): value is Product =>
  isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string' &&
  typeof value.category_id === 'number' && isNumeric(value.price);
const isArrayOf = <T>(itemGuard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] => Array.isArray(value) && value.every(itemGuard);

async function requestData<T>(
  url: string,
  options: RequestInit,
  fallbackMessage: string,
  isValid: (value: unknown) => value is T,
  authenticated = true
): Promise<T> {
  const res = await fetchWithTimeout(url, options);
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (authenticated && res.status === 401) handleUnauthorized();
    throw new Error((isRecord(json) && typeof json.message === 'string' && json.message) || fallbackMessage);
  }

  if (!isRecord(json) || json.success !== true || !isValid(json.data)) {
    throw new Error('The server returned an invalid response. Please try again.');
  }

  return json.data;
}

const isOrderArray = isArrayOf(isOrder);
const isProductArray = isArrayOf(isProduct);
const isAnyData = (_value: unknown): _value is any => true;

export async function loginCashier(username: string, password: string): Promise<UserAuthResponse> {
  const data = await requestData<UserAuthResponse>(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    },
    'Login failed. Please check credentials.',
    (value): value is UserAuthResponse =>
      isRecord(value) && typeof value.token === 'string' && isRecord(value.user),
    false
  );
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchOrders(status?: string, search?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  return requestData(`${API_BASE}/orders?${params.toString()}`, { headers: getHeaders() }, 'Unable to load orders.', isOrderArray);
}

export async function searchOrderByRef(reference: string): Promise<Order> {
  return requestData<Order>(`${API_BASE}/orders/ref/${encodeURIComponent(reference.trim())}`, { headers: getHeaders() }, `No order found with reference "${reference}".`, isRecord as (value: unknown) => value is Order);
}

export async function fetchOrderById(id: number): Promise<Order> {
  return requestData<Order>(`${API_BASE}/orders/${id}`, { headers: getHeaders() }, 'Order details not found.', isRecord as (value: unknown) => value is Order);
}

export async function processOrderPayment(input: ProcessPaymentInput): Promise<any> {
  return requestData(`${API_BASE}/payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(input) }, 'Failed to process payment.', isRecord);
}

export async function fetchReceiptData(orderId: number): Promise<any> {
  return requestData(`${API_BASE}/payments/receipt/${orderId}`, { headers: getHeaders() }, 'Receipt data not found.', isRecord);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return requestData<DashboardMetrics>(`${API_BASE}/sales/metrics`, { headers: getHeaders() }, 'Failed to load metrics.', isRecord as (value: unknown) => value is DashboardMetrics);
}

export async function fetchProducts(): Promise<Product[]> {
  return requestData(`${API_BASE}/products`, { headers: getHeaders() }, 'Failed to load products.', isProductArray);
}

export async function createDirectOrder(input: CreateOrderInput): Promise<Order> {
  return requestData<Order>(
    `${API_BASE}/orders`,
    {
      method: 'POST',
      headers: {
        ...getHeaders(),
        ...(input.idempotency_key ? { 'Idempotency-Key': input.idempotency_key } : {})
      },
      body: JSON.stringify(input)
    },
    'Failed to create order.',
    isRecord as (value: unknown) => value is Order
  );
}

export async function cancelOrder(orderId: number): Promise<void> {
  await requestData(`${API_BASE}/orders/${orderId}/cancel`, { method: 'POST', headers: getHeaders() }, 'Failed to cancel order.', isAnyData);
}
