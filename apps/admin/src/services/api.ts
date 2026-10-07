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

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function getStoredToken(): string | null {
  return localStorage.getItem('baradmin_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('baradmin_token', token);
}

export function getStoredUser(): User | null {
  const d = localStorage.getItem('baradmin_user');
  return d ? JSON.parse(d) : null;
}

export function setStoredUser(u: User): void {
  localStorage.setItem('baradmin_user', JSON.stringify(u));
}

export function clearAdminSession(): void {
  localStorage.removeItem('baradmin_token');
  localStorage.removeItem('baradmin_user');
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<UserAuthResponse> {

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed.');
  }

  const json = await res.json();

  if (json.data.user.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.');
  }

  setStoredToken(json.data.token);
  setStoredUser(json.data.user);

  return json.data;
}

// Products
export async function fetchProducts(includeInactive = true): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products?includeInactive=${includeInactive}`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

export async function createProduct(data: any): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create product.');
  }
  const json = await res.json();
  return json.data;
}

export async function updateProduct(id: number, data: any): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update product.');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteOrDeactivateProduct(id: number): Promise<string> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const json = await res.json();
  return json.message;
}

// Categories
export async function fetchCategories(includeInactive = true): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories?includeInactive=${includeInactive}`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

export async function createCategory(data: any): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create category.');
  }
  const json = await res.json();
  return json.data;
}

export async function updateCategory(id: number, data: any): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return json.data;
}

// Tables
export async function fetchTables(includeInactive = true): Promise<BarTable[]> {
  const res = await fetch(`${API_BASE}/tables?includeInactive=${includeInactive}`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

export async function createTable(
  table_number: string,
  label?: string
): Promise<BarTable> {
  const res = await fetch(`${API_BASE}/tables`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ table_number, label })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create table.');
  }

  const json = await res.json();
  return json.data;
}

export async function updateTable(
  id: number,
  data: any
): Promise<BarTable> {
  const res = await fetch(`${API_BASE}/tables/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  const json = await res.json();
  return json.data;
}

// Orders
export async function fetchOrders(status?: string, search?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

// Sales
export async function fetchSalesReports(filters: SalesFilter): Promise<SalesSummary> {
  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.payment_method && filters.payment_method !== 'ALL') {
    params.append('payment_method', filters.payment_method);
  }

  const res = await fetch(`${API_BASE}/sales?${params.toString()}`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/sales/metrics`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

// Users
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getHeaders()
  });
  const json = await res.json();
  return json.data;
}

export async function createUser(data: any): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create user.');
  }
  const json = await res.json();
  return json.data;
}

export async function updateUser(id: number, data: any): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return json.data;
}
