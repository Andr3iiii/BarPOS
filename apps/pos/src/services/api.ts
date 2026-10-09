import {
  Order,
  ProcessPaymentInput,
  DashboardMetrics,
  Product,
  Category,
  BarTable,
  CreateOrderInput,
  User,
  UserAuthResponse,
  SalesFilter,
  SalesSummary
} from '../types';
import { fetchWithTimeout } from '../../../../shared/http';

function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('barpos_api_url');
    if (custom && /barpos-7rxf\.onrender\.com/i.test(custom)) {
      localStorage.removeItem('barpos_api_url');
    } else if (custom && custom.trim() !== '') {
      return custom.trim().replace(/\/+$/, '');
    }
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
  return localStorage.getItem('barpos_token') || localStorage.getItem('baradmin_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('barpos_token', token);
  localStorage.setItem('baradmin_token', token);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('barpos_user') || localStorage.getItem('baradmin_user');
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
  localStorage.setItem('baradmin_user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('barpos_token');
  localStorage.removeItem('barpos_user');
  localStorage.removeItem('baradmin_token');
  localStorage.removeItem('baradmin_user');
}

export const clearAdminSession = clearSession;

export function getSessionMessage(): string | null {
  return localStorage.getItem('barpos_session_message') || localStorage.getItem('baradmin_session_message');
}

export function clearSessionMessage(): void {
  localStorage.removeItem('barpos_session_message');
  localStorage.removeItem('baradmin_session_message');
}

export function expireSession(): void {
  clearSession();
  localStorage.setItem('barpos_session_message', SESSION_EXPIRED_MESSAGE);
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:' || Boolean((window as any).electronAPI?.isElectron)) {
      window.location.hash = '#/login';
    } else {
      window.location.assign('/login');
    }
  }
}

function handleUnauthorized(): never {
  expireSession();
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
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

const isCategory = (value: unknown): value is Category =>
  isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string';

const isTable = (value: unknown): value is BarTable =>
  isRecord(value) && typeof value.id === 'number' && typeof value.table_number === 'string' &&
  typeof value.label === 'string';

const isUser = (value: unknown): value is User =>
  isRecord(value) && typeof value.id === 'number' && typeof value.username === 'string' &&
  typeof value.full_name === 'string' && (value.role === 'admin' || value.role === 'cashier');

const isDashboardMetrics = (value: unknown): value is DashboardMetrics =>
  isRecord(value) &&
  ['today_sales', 'pending_orders', 'paid_orders', 'total_orders'].every(
    (key) => typeof value[key] === 'number'
  );

const isSalesSummary = (value: unknown): value is SalesSummary =>
  isRecord(value) &&
  typeof value.total_revenue === 'number' &&
  typeof value.total_orders === 'number' &&
  typeof value.average_ticket === 'number' &&
  isRecord(value.by_payment_method) &&
  Array.isArray(value.records);

const isArrayOf = <T>(itemGuard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] => Array.isArray(value) && value.every(itemGuard);

const isOrderArray = isArrayOf(isOrder);
const isProductArray = isArrayOf(isProduct);
const isCategoryArray = isArrayOf(isCategory);
const isTableArray = isArrayOf(isTable);
const isUserArray = isArrayOf(isUser);
const isRecordData = (value: unknown): value is Record<string, any> => isRecord(value);

async function requestData<T>(
  url: string,
  options: RequestInit,
  fallbackMessage: string,
  isValid: (value: unknown) => value is T,
  authenticated = true
): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(url, options);
  } catch (err: any) {
    if (err.message && /aborted|timeout/i.test(err.message)) {
      throw new Error('Connection timeout. The server took too long to respond.');
    }
    throw new Error('Cannot connect to server. Please ensure the backend is running.');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = isRecord(json) && typeof json.message === 'string' ? json.message : '';
    const isAuthFailure = res.status === 401 || (res.status === 403 && /token|session|unauthorized|expired|invalid/i.test(message));
    if (authenticated && isAuthFailure) handleUnauthorized();
    throw new Error(message || fallbackMessage);
  }

  if (!isRecord(json) || json.success !== true || !isValid(json.data)) {
    throw new Error('The server returned an invalid response. Please try again.');
  }

  return json.data;
}

async function requestMessage(url: string, options: RequestInit, fallbackMessage: string): Promise<string> {
  let res: Response;
  try {
    res = await fetchWithTimeout(url, options);
  } catch (err: any) {
    throw new Error('Cannot connect to server. Please ensure the backend is running.');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = isRecord(json) && typeof json.message === 'string' ? json.message : '';
    if (res.status === 401) handleUnauthorized();
    throw new Error(message || fallbackMessage);
  }

  if (!isRecord(json) || json.success !== true || typeof json.message !== 'string') {
    throw new Error('The server returned an invalid response. Please try again.');
  }
  return json.message;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function loginUser(username: string, password: string): Promise<UserAuthResponse> {
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

export const loginCashier = loginUser;
export const loginAdmin = loginUser;

// ---------------------------------------------------------------------------
// POS Cashier Services
// ---------------------------------------------------------------------------

export async function fetchOrders(status?: string, search?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  return requestData(
    `${API_BASE}/orders?${params.toString()}`,
    { headers: getHeaders() },
    'Unable to load orders.',
    isOrderArray
  );
}

export async function searchOrderByRef(reference: string): Promise<Order> {
  return requestData<Order>(
    `${API_BASE}/orders/ref/${encodeURIComponent(reference.trim())}`,
    { headers: getHeaders() },
    `No order found with reference "${reference}".`,
    isRecord as (value: unknown) => value is Order
  );
}

export async function fetchOrderById(id: number): Promise<Order> {
  return requestData<Order>(
    `${API_BASE}/orders/${id}`,
    { headers: getHeaders() },
    'Order details not found.',
    isRecord as (value: unknown) => value is Order
  );
}

export async function processOrderPayment(input: ProcessPaymentInput): Promise<any> {
  return requestData(
    `${API_BASE}/payments`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(input) },
    'Failed to process payment.',
    isRecordData
  );
}

export async function fetchReceiptData(orderId: number): Promise<any> {
  return requestData(
    `${API_BASE}/payments/receipt/${orderId}`,
    { headers: getHeaders() },
    'Receipt data not found.',
    isRecordData
  );
}

export async function createDirectOrder(input: CreateOrderInput): Promise<Order> {
  return requestData<Order>(
    `${API_BASE}/orders`,
    {
      method: 'POST',
      headers: {
        ...(getHeaders() as Record<string, string>),
        ...(input.idempotency_key ? { 'Idempotency-Key': input.idempotency_key } : {})
      },
      body: JSON.stringify(input)
    },
    'Failed to create order.',
    isRecord as (value: unknown) => value is Order
  );
}

export async function cancelOrder(orderId: number): Promise<void> {
  await requestData(
    `${API_BASE}/orders/${orderId}/cancel`,
    { method: 'POST', headers: getHeaders() },
    'Failed to cancel order.',
    isRecordData
  );
}

// ---------------------------------------------------------------------------
// Admin & Management Services
// ---------------------------------------------------------------------------

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return requestData<DashboardMetrics>(
    `${API_BASE}/sales/metrics`,
    { headers: getHeaders() },
    'Failed to load metrics.',
    isDashboardMetrics
  );
}

export async function fetchProducts(includeInactive = true): Promise<Product[]> {
  return requestData(
    `${API_BASE}/products?includeInactive=${includeInactive}`,
    { headers: getHeaders() },
    'Failed to load products.',
    isProductArray
  );
}

export async function createProduct(data: any): Promise<Product> {
  return requestData<Product>(
    `${API_BASE}/products`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to create product.',
    isRecordData as (value: unknown) => value is Product
  );
}

export async function updateProduct(id: number, data: any): Promise<Product> {
  return requestData<Product>(
    `${API_BASE}/products/${id}`,
    { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to update product.',
    isRecordData as (value: unknown) => value is Product
  );
}

export async function deleteOrDeactivateProduct(id: number): Promise<string> {
  return requestMessage(
    `${API_BASE}/products/${id}`,
    { method: 'DELETE', headers: getHeaders() },
    'Failed to delete product.'
  );
}

export async function fetchCategories(includeInactive = true): Promise<Category[]> {
  return requestData(
    `${API_BASE}/categories?includeInactive=${includeInactive}`,
    { headers: getHeaders() },
    'Failed to load categories.',
    isCategoryArray
  );
}

export async function createCategory(data: any): Promise<Category> {
  return requestData<Category>(
    `${API_BASE}/categories`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to create category.',
    isRecordData as (value: unknown) => value is Category
  );
}

export async function updateCategory(id: number, data: any): Promise<Category> {
  return requestData<Category>(
    `${API_BASE}/categories/${id}`,
    { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to update category.',
    isRecordData as (value: unknown) => value is Category
  );
}

export async function fetchTables(includeInactive = true): Promise<BarTable[]> {
  return requestData(
    `${API_BASE}/tables?includeInactive=${includeInactive}`,
    { headers: getHeaders() },
    'Failed to load tables.',
    isTableArray
  );
}

export async function createTable(table_number: string, label?: string): Promise<BarTable> {
  return requestData<BarTable>(
    `${API_BASE}/tables`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify({ table_number, label }) },
    'Failed to create table.',
    isRecordData as (value: unknown) => value is BarTable
  );
}

export async function updateTable(id: number, data: any): Promise<BarTable> {
  return requestData<BarTable>(
    `${API_BASE}/tables/${id}`,
    { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to update table.',
    isRecordData as (value: unknown) => value is BarTable
  );
}

export async function fetchSalesReports(filters: SalesFilter): Promise<SalesSummary> {
  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.payment_method && filters.payment_method !== 'ALL') {
    params.append('payment_method', filters.payment_method);
  }
  return requestData(
    `${API_BASE}/sales?${params.toString()}`,
    { headers: getHeaders() },
    'Failed to load sales reports.',
    isSalesSummary
  );
}

export async function fetchUsers(): Promise<User[]> {
  return requestData(`${API_BASE}/users`, { headers: getHeaders() }, 'Failed to fetch users.', isUserArray);
}

export async function createUser(data: any): Promise<User> {
  return requestData<User>(
    `${API_BASE}/users`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to create user.',
    isRecordData as (value: unknown) => value is User
  );
}

export async function updateUser(id: number, data: any): Promise<User> {
  return requestData<User>(
    `${API_BASE}/users/${id}`,
    { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) },
    'Failed to update user.',
    isRecordData as (value: unknown) => value is User
  );
}
