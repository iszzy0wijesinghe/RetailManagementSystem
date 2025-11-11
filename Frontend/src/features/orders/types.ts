// src/features/orders/types.ts

export type OrderItemDto = {
  orderItemId: number;
  productId: number;
  productNameSnapshot: string;
  productName?: string | null;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  lineTotal: number;
};

export type OrderDetailsDto = {
  orderId: number;
  orderNumber: string;
  customerId: number | null;
  status: string;            // "Unpaid" | "Paid" | "Voided"
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

export type CreateOrderDto = {
  customerId?: number | null;
};

export type AddItemDto = {
  productId: number;
  quantity: number; // > 0
};

export type PayOrderDto = {
  changedByUserId: number;
  customerId?: number | null; // optional passthrough if needed
};

export type ApplyCouponDto = {
  code: string;
  customerId?: number | null;
};

export type ProductLite = {
  productId: number;
  name: string;
  unitPrice: number;
  qtyOnHand: number;
};
