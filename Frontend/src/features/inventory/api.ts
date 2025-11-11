
import { baseApi } from '../../app/api/baseApi';
import type { InventoryDetailsDto, AdjustStockDto } from './types';

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInventory: build.query<InventoryDetailsDto[], void>({
      query: () => 'inventory', // GET api/inventory
      providesTags: (result) =>
        result
          ? [
              ...result.map(r => ({ type: 'Inventory' as const, id: r.productId })),
              { type: 'Inventory' as const, id: 'LIST' },
            ]
          : [{ type: 'Inventory' as const, id: 'LIST' }],
    }),

    getInventoryByProduct: build.query<InventoryDetailsDto, number>({
      query: (productId) => `inventory/${productId}`, // GET api/inventory/{productId}
      providesTags: (_r, _e, productId) => [{ type: 'Inventory', id: productId }],
    }),

    adjustStock: build.mutation<void, AdjustStockDto>({
      query: (body) => ({
        url: 'inventory/adjust', // POST api/inventory/adjust
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Inventory', id: arg.productId },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInventoryQuery,
  useGetInventoryByProductQuery,
  useLazyGetInventoryByProductQuery,
  useAdjustStockMutation,
} = inventoryApi;
