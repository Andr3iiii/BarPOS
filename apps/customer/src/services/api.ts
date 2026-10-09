import { Product, Category, BarTable, CreateOrderInput, Order } from '../types';
import { fetchWithTimeout } from '../../../../shared/http';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

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
const isArrayOf = <T>(itemGuard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] => Array.isArray(value) && value.every(itemGuard);

async function requestData<T>(
  url: string,
  options: RequestInit,
  fallbackMessage: string,
  isValid: (value: unknown) => value is T
): Promise<T> {
  const res = await fetchWithTimeout(url, options);
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((isRecord(json) && typeof json.message === 'string' && json.message) || fallbackMessage);
  }

  if (!isRecord(json) || json.success !== true || !isValid(json.data)) {
    throw new Error('The server returned an invalid response. Please try again.');
  }

  return json.data;
}

const isProductArray = isArrayOf(isProduct);
const isCategoryArray = isArrayOf(isCategory);
const isRecordData = (value: unknown): value is Record<string, any> => isRecord(value);

export async function fetchPublicMenu(): Promise<Product[]> {
  return requestData<Product[]>(`${API_BASE}/products/menu`, {}, 'Unable to load menu. Please check your internet connection.', isProductArray);
}

export async function fetchCategories(): Promise<Category[]> {
  return requestData<Category[]>(`${API_BASE}/categories`, {}, 'Unable to load categories.', isCategoryArray);
}

export async function verifyTable(tableNumber: string): Promise<BarTable> {
  return requestData<BarTable>(`${API_BASE}/tables/number/${encodeURIComponent(tableNumber)}`, {}, `Table "${tableNumber}" not recognized. Please scan a valid table QR code.`, isRecordData as (value: unknown) => value is BarTable);
}

export async function submitOrder(input: CreateOrderInput): Promise<Order> {
  return requestData<Order>(
    `${API_BASE}/orders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(input.idempotency_key ? { 'Idempotency-Key': input.idempotency_key } : {})
      },
      body: JSON.stringify(input)
    },
    'Unable to submit your order. Please try again or notify the bartender.',
    isRecordData as (value: unknown) => value is Order
  );
}

export async function fetchOrderById(id: number): Promise<Order> {
  return requestData<Order>(`${API_BASE}/orders/${id}`, {}, 'Order not found.', isRecordData as (value: unknown) => value is Order);
}

export async function fetchOrderByRef(reference: string): Promise<Order> {
  return requestData<Order>(`${API_BASE}/orders/ref/${encodeURIComponent(reference.trim())}`, {}, 'Order not found.', isRecordData as (value: unknown) => value is Order);
}
