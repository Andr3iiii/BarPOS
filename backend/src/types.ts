// ==============================================================================
// BAR POS SYSTEM - TYPES & CONSTANTS
// ==============================================================================

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  GCASH: 'GCASH',
  CARD: 'CARD'
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

export const USER_ROLE = {
  ADMIN: 'admin',
  CASHIER: 'cashier'
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export const BAR_SETTINGS = {
  NAME: 'THE VELVET TAP BAR & LOUNGE',
  TAGLINE: 'Craft Brews • Cocktails • Bites',
  CURRENCY_SYMBOL: '₱',
  CURRENCY_CODE: 'PHP',
  TAX_RATE: 0.00
} as const;

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserAuthResponse {
  user: User;
  token: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarTable {
  id: number;
  table_number: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  item_notes?: string | null;
}

export interface Order {
  id: number;
  reference_no: string;
  table_id: number;
  table_number: string;
  table_label: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  customer_notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment?: Payment | null;
}

export interface CreateOrderItemInput {
  product_id: number;
  quantity: number;
  item_notes?: string;
}

export interface CreateOrderInput {
  table_number: string;
  customer_notes?: string;
  items: CreateOrderItemInput[];
  idempotency_key?: string;
}

export interface Payment {
  id: number;
  order_id: number;
  order_reference?: string;
  payment_method: PaymentMethod;
  total_amount: number;
  amount_received: number;
  change_amount: number;
  payment_reference?: string | null;
  cashier_id?: number | null;
  cashier_name?: string | null;
  created_at: string;
}

export interface ProcessPaymentInput {
  order_id: number;
  payment_method: PaymentMethod;
  amount_received: number;
  payment_reference?: string;
}

export interface DashboardMetrics {
  today_sales: number;
  pending_orders: number;
  paid_orders: number;
  total_orders: number;
}

export interface SalesFilter {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  start_date?: string;
  end_date?: string;
  payment_method?: PaymentMethod | 'ALL';
}

export interface SalesRecord {
  order_id: number;
  reference_no: string;
  table_number: string;
  table_label: string;
  date: string;
  time: string;
  total: number;
  payment_method: PaymentMethod;
  amount_received: number;
  change_amount: number;
  cashier_name: string;
  status: OrderStatus;
  items_count: number;
}

export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  by_payment_method: {
    CASH: number;
    GCASH: number;
    CARD: number;
  };
  records: SalesRecord[];
}
