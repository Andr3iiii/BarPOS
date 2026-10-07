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
  TAX_RATE: 0.00 // Included in price by default for bar POS
} as const;
