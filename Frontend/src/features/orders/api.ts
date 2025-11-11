// src/features/orders/api.ts
import { baseApi } from "../../app/api/baseApi";
import type {
  OrderDetailsDto,
  CreateOrderDto,
  AddItemDto,
  PayOrderDto,
  ApplyCouponDto,
} from "./types";

/** Row shape for the admin orders list (matches backend OrderListItemDto) */
export type OrderListItemDto = {
  orderId: number;
  orderNumber: string;
  status: string;
  customerId?: number | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Generic pager wrapper (matches backend PagedResult<T>) */
export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

/** Lightweight product shape returned by /api/products/search */
export type ProductLite = {
  productId: number;
  name: string;
  unitPrice: number;
  qtyOnHand: number;
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Admin list (paged) – GET /api/orders */
    getOrders: build.query<
      PagedResult<OrderListItemDto>,
      { status?: string | null; q?: string | null; page?: number; pageSize?: number }
    >({
      query: ({ status, q, page = 1, pageSize = 20 }) => ({
        url: "orders",
        params: { status: status ?? "", q: q ?? "", page, pageSize },
      }),
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),

    /** Keep for POS flow (admin page won’t create) */
    createOrder: build.mutation<number, CreateOrderDto>({
      query: (body) => ({ url: "orders", method: "POST", body }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
      transformResponse: (id: number) => id,
    }),

    /** Admin + POS detail fetch – GET /api/orders/{id} */
    getOrderById: build.query<OrderDetailsDto, number>({
      query: (id) => `orders/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Orders", id }],
    }),

    /** Items */
    addItem: build.mutation<void, { id: number; body: AddItemDto }>({
      query: ({ id, body }) => ({ url: `orders/${id}/items`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    updateItem: build.mutation<void, { id: number; itemId: number; body: AddItemDto }>({
      query: ({ id, itemId, body }) => ({
        url: `orders/${id}/items/${itemId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    removeItem: build.mutation<void, { id: number; itemId: number }>({
      query: ({ id, itemId }) => ({
        url: `orders/${id}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    /** Pay / Coupon / Void */
    payOrder: build.mutation<void, { id: number; body: PayOrderDto }>({
      query: ({ id, body }) => ({ url: `orders/${id}/pay`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    applyCoupon: build.mutation<void, { id: number; body: ApplyCouponDto }>({
      query: ({ id, body }) => ({ url: `orders/${id}/coupon`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    removeCoupon: build.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `orders/${id}/coupon`, method: "DELETE" }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    voidOrder: build.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `orders/${id}/void`, method: "POST", body: {} }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }],
    }),

    /** POS product search (name + numeric productId) */
    searchProducts: build.query<ProductLite[], { q: string; take?: number; onlyActive?: boolean }>({
      query: ({ q, take = 20, onlyActive = true }) => ({
        url: "products/search",
        method: "GET",
        params: { q, take, onlyActive },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrdersQuery,            // ✅ now exported
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useAddItemMutation,
  useUpdateItemMutation,
  useRemoveItemMutation,
  usePayOrderMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
  useVoidOrderMutation,
  useLazySearchProductsQuery,
} = ordersApi;



















// // src/features/orders/api.ts
// import { baseApi } from '../../app/api/baseApi';
// import type {
//   OrderDetailsDto, CreateOrderDto, AddItemDto, PayOrderDto, ApplyCouponDto, ProductLite
// } from './types';

// export const ordersApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({

//     // (keep if other parts of app use this — but you won't show “New Order” here)
//     createOrder: build.mutation<number, CreateOrderDto>({
//       query: (body) => ({ url: 'orders', method: 'POST', body }),
//       invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
//       transformResponse: (id: number) => id,
//     }),

    

//     getOrderById: build.query<OrderDetailsDto, number>({
//       query: (id) => `orders/${id}`,
//       providesTags: (_res, _err, id) => [{ type: 'Orders', id }],
//     }),

//     addItem: build.mutation<void, { id: number; body: AddItemDto }>({
//       query: ({ id, body }) => ({ url: `orders/${id}/items`, method: 'POST', body }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     updateItem: build.mutation<void, { id: number; itemId: number; body: AddItemDto }>({
//       query: ({ id, itemId, body }) => ({ url: `orders/${id}/items/${itemId}`, method: 'PUT', body }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     removeItem: build.mutation<void, { id: number; itemId: number }>({
//       query: ({ id, itemId }) => ({ url: `orders/${id}/items/${itemId}`, method: 'DELETE' }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     payOrder: build.mutation<void, { id: number; body: PayOrderDto }>({
//       query: ({ id, body }) => ({ url: `orders/${id}/pay`, method: 'POST', body }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     applyCoupon: build.mutation<void, { id: number; body: ApplyCouponDto }>({
//       query: ({ id, body }) => ({ url: `orders/${id}/coupon`, method: 'POST', body }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     removeCoupon: build.mutation<void, { id: number }>({
//       query: ({ id }) => ({ url: `orders/${id}/coupon`, method: 'DELETE' }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),

//     // NEW: POST /api/orders/{id}/void
//     voidOrder: build.mutation<void, { id: number }>({
//       query: ({ id }) => ({ url: `orders/${id}/void`, method: 'POST', body: {} }),
//       invalidatesTags: (_r, _e, arg) => [{ type: 'Orders', id: arg.id }],
//     }),


//     searchProducts: build.query<ProductLite[], { q: string; take?: number; onlyActive?: boolean }>({
//       query: ({ q, take = 20, onlyActive = true }) => ({
//         url: "products/search",
//         method: "GET",
//         params: { q, take, onlyActive },
//       }),
//     }),

//   }),
// });

// export const {
//   useCreateOrderMutation,          // keep exported for POS flow if needed elsewhere
//   useGetOrderByIdQuery,
//   useLazyGetOrderByIdQuery,
//   useAddItemMutation,
//   useUpdateItemMutation,
//   useRemoveItemMutation,
//   usePayOrderMutation,
//   useApplyCouponMutation,
//   useRemoveCouponMutation,
//   useVoidOrderMutation,
//   useLazySearchProductsQuery,            // 👈 new
// } = ordersApi;
