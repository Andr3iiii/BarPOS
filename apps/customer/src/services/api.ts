import { Product, Category, BarTable, CreateOrderInput, Order } from '@barpos/shared';

const API_BASE = '/api/v1';

export async function fetchPublicMenu(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products/menu`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to load menu. Please check your internet connection.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to load categories.');
  }
  const json = await res.json();
  return json.data;
}

export async function verifyTable(tableNumber: string): Promise<BarTable> {
  const res = await fetch(`${API_BASE}/tables/number/${encodeURIComponent(tableNumber)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Table "${tableNumber}" not recognized. Please scan a valid table QR code.`);
  }
  const json = await res.json();
  return json.data;
}

export async function submitOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to submit your order. Please try again or notify the bartender.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchOrderById(id: number): Promise<Order> {
  // Public or ref query
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Order not found.');
  }
  const json = await res.json();
  return json.data;
}
