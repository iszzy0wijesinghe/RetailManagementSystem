// src/features/products/api.ts
import { baseApi } from "../../app/api/baseApi";
import type {
  ProductListItem,
  ProductDetailsDto,
  ProductCreateDto,
  ProductUpdateDto,
  Category,
} from "./types";


export const productsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (b) => ({
    // GET /api/products?q=&active=
    // active: true -> only active, false -> only inactive, undefined -> both
    getProducts: b.query<
      ProductListItem[],
      { q?: string; active?: boolean | null } | void
    >({
      query: (args) => {
        const p = new URLSearchParams();
        if (args && typeof args === "object") {
          if (args.q) p.set("q", args.q);
          if ("active" in args && args.active !== null && args.active !== undefined) {
            p.set("active", String(args.active)); // 'true' | 'false'
          }
        }
        const qs = p.toString();
        return `products${qs ? `?${qs}` : ""}`;
      },
      providesTags: (res) =>
        res
          ? [
              ...res.map((p) => ({ type: "Products" as const, id: p.productId })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
    }),

    // GET /api/products/{id}
    getProductById: b.query<ProductDetailsDto, number>({
      query: (id) => `products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),

    // POST /api/products  -> returns new ProductId (number)
    createProduct: b.mutation<number, ProductCreateDto>({
      query: (body) => ({
        url: "products",
        method: "POST",
        body,
      }),
      transformResponse: (id: number) => id,
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    // PUT /api/products/{id}
    updateProduct: b.mutation<void, { id: number; body: ProductUpdateDto }>({
      query: ({ id, body }) => ({
        url: `products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),

    // DELETE /api/products/{id}  (soft-delete in your controller)
    deleteProduct: b.mutation<void, number>({
      query: (id) => ({
        url: `products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),

    // GET /api/categories  (adjust path/params if your controller differs)
    getCategories: b.query<Category[], void>({
      query: () => `categories`,
      providesTags: (res) =>
        res
          ? [
              ...res.map((c) => ({ type: "Categories" as const, id: c.categoryId })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
} = productsApi;
