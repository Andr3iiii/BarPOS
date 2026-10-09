import {
  User,
  UserAuthResponse,
  Product,
  Category,
  BarTable,
  Order,
  SalesSummary,
  DashboardMetrics,
  SalesFilter
} from '../types';
import { fetchWithTimeout } from '../../../../shared/http';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

export function getStoredToken(): string | null {
  return localStorage.getItem('baradmin_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('baradmin_token', token);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('baradmin_user');
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function setStoredUser(u: User): void {
  localStorage.setItem('baradmin_user', JSON.stringify(u));
}

export function clearAdminSession(): void {
  localStorage.removeItem('baradmin_token');
  localStorage.removeItem('baradmin_user');
}

export function getSessionMessage(): string | null {
  return localStorage.getItem('baradmin_session_message');
}

export function clearSessionMessage(): void {
  localStorage.removeItem('baradmin_session_message');
}

export function expireSession(): void {
  clearAdminSession();
  localStorage.setItem('baradmin_session_message', SESSION_EXPIRED_MESSAGE);
  if (typeof window !== 'undefined') window.location.assign('/login');
}

function handleUnauthorized(): never {
  expireSession();
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

function getHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
const isNumeric = (value: unknown): boolean =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));

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
const isOrder = (value: unknown): value is Order =>
  isRecord(value) && typeof value.id === 'number' && typeof value.reference_no === 'string' &&
  isNumeric(value.total) && (!('items' in value) || Array.isArray(value.items));
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

async function requestMessage(url: string, options: RequestInit, fallbackMessage: string): Promise<string> {
  const res = await fetchWithTimeout(url, options);
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error((isRecord(json) && typeof json.message === 'string' && json.message) || fallbackMessage);
  }

  if (!isRecord(json) || json.success !== true || typeof json.message !== 'string') {
    throw new Error('The server returned an invalid response. Please try again.');
  }
  return json.message;
}

const isProductArray = isArrayOf(isProduct);
const isCategoryArray = isArrayOf(isCategory);
const isTableArray = isArrayOf(isTable);
const isOrderArray = isArrayOf(isOrder);
const isUserArray = isArrayOf(isUser);
const isRecordData = (value: unknown): value is Record<string, any> => isRecord(value);
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
export async function loginAdmin(username: string, password: string): Promise<UserAuthResponse> {
  const data = await requestData<UserAuthResponse>(
    `${API_BASE}/auth/login`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) },
    'Login failed. Please check credentials.',
    (value): value is UserAuthResponse => isRecord(value) && typeof value.token === 'string' && isRecord(value.user),
    false
  );

  if (data.user.role !== 'admin') throw new Error('Access denied. Administrator privileges required.');
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchProducts(includeInactive = true): Promise<Product[]> {
  return requestData(`${API_BASE}/products?includeInactive=${includeInactive}`, { headers: getHeaders() }, 'Failed to load products.', isProductArray);
}

export async function createProduct(data: any): Promise<Product> {
  return requestData<Product>(`${API_BASE}/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to create product.', isRecordData as (value: unknown) => value is Product);
}

export async function updateProduct(id: number, data: any): Promise<Product> {
  return requestData<Product>(`${API_BASE}/products/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to update product.', isRecordData as (value: unknown) => value is Product);
}

export async function deleteOrDeactivateProduct(id: number): Promise<string> {
  return requestMessage(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getHeaders() }, 'Failed to delete product.');
}

export async function fetchCategories(includeInactive = true): Promise<Category[]> {
  return requestData(`${API_BASE}/categories?includeInactive=${includeInactive}`, { headers: getHeaders() }, 'Failed to load categories.', isCategoryArray);
}

export async function createCategory(data: any): Promise<Category> {
  return requestData<Category>(`${API_BASE}/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to create category.', isRecordData as (value: unknown) => value is Category);
}

export async function updateCategory(id: number, data: any): Promise<Category> {
  return requestData<Category>(`${API_BASE}/categories/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to update category.', isRecordData as (value: unknown) => value is Category);
}

export async function fetchTables(includeInactive = true): Promise<BarTable[]> {
  return requestData(`${API_BASE}/tables?includeInactive=${includeInactive}`, { headers: getHeaders() }, 'Failed to load tables.', isTableArray);
}

export async function createTable(table_number: string, label?: string): Promise<BarTable> {
  return requestData<BarTable>(`${API_BASE}/tables`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ table_number, label }) }, 'Failed to create table.', isRecordData as (value: unknown) => value is BarTable);
}

export async function updateTable(id: number, data: any): Promise<BarTable> {
  return requestData<BarTable>(`${API_BASE}/tables/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to update table.', isRecordData as (value: unknown) => value is BarTable);
}

export async function fetchOrders(status?: string, search?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);
  return requestData(`${API_BASE}/orders?${params.toString()}`, { headers: getHeaders() }, 'Failed to load orders.', isOrderArray);
}

export async function fetchSalesReports(filters: SalesFilter): Promise<SalesSummary> {
  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.payment_method && filters.payment_method !== 'ALL') params.append('payment_method', filters.payment_method);
  return requestData(`${API_BASE}/sales?${params.toString()}`, { headers: getHeaders() }, 'Failed to load sales reports.', isSalesSummary);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return requestData(`${API_BASE}/sales/metrics`, { headers: getHeaders() }, 'Failed to load dashboard metrics.', isDashboardMetrics);
}

export async function fetchUsers(): Promise<User[]> {
  return requestData(`${API_BASE}/users`, { headers: getHeaders() }, 'Failed to fetch users.', isUserArray);
}

export async function createUser(data: any): Promise<User> {
  return requestData<User>(`${API_BASE}/users`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to create user.', isRecordData as (value: unknown) => value is User);
}

export async function updateUser(id: number, data: any): Promise<User> {
  return requestData<User>(`${API_BASE}/users/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }, 'Failed to update user.', isRecordData as (value: unknown) => value is User);
}
