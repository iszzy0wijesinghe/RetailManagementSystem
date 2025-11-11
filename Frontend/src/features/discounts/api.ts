import { baseApi } from "../../app/api/baseApi";
import type {
  DiscountListItem,
  DiscountDetailsDto,
  DiscountCreateDto,
  DiscountUpdateDto,
  DiscountLinkCategoryDto,
  DiscountLinkProductDto,
} from "./types";

export const discountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDiscounts: build.query<
      DiscountListItem[],
      { includeInactive?: boolean; q?: string } | void
    >({
      query: (params) => ({
        url: "discounts",
        params: {
          includeInactive: params?.includeInactive ?? false,
          q: params?.q ?? undefined,
        },
      }),
      providesTags: (res) =>
        res
          ? [
              ...res.map((d) => ({ type: "Discount" as const, id: d.discountId })),
              { type: "Discount" as const, id: "LIST" as const },
            ]
          : [{ type: "Discount" as const, id: "LIST" as const }],
    }),

    getDiscountById: build.query<DiscountDetailsDto, number>({
      query: (id) => `discounts/${id}`,
      providesTags: (_res, _e, id) => [{ type: "Discount", id }],
    }),

    createDiscount: build.mutation<number, DiscountCreateDto>({
      query: (body) => ({
        url: "discounts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Discount", id: "LIST" }],
    }),

    updateDiscount: build.mutation<void, { id: number; body: DiscountUpdateDto }>({
      query: ({ id, body }) => ({
        url: `discounts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Discount", id: arg.id },
        { type: "Discount", id: "LIST" },
      ],
    }),

    setDiscountActive: build.mutation<void, { id: number; value: boolean }>({
      query: ({ id, value }) => ({
        url: `discounts/${id}/active`,
        method: "PUT",
        params: { value },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Discount", id: arg.id },
        { type: "Discount", id: "LIST" },
      ],
    }),

    linkCategory: build.mutation<void, { id: number; body: DiscountLinkCategoryDto }>({
      query: ({ id, body }) => ({
        url: `discounts/${id}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Discount", id: arg.id }],
    }),

    unlinkCategory: build.mutation<void, { id: number; categoryId: number }>({
      query: ({ id, categoryId }) => ({
        url: `discounts/${id}/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Discount", id: arg.id }],
    }),

    linkProduct: build.mutation<void, { id: number; body: DiscountLinkProductDto }>({
      query: ({ id, body }) => ({
        url: `discounts/${id}/products`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Discount", id: arg.id }],
    }),

    unlinkProduct: build.mutation<void, { id: number; productId: number }>({
      query: ({ id, productId }) => ({
        url: `discounts/${id}/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Discount", id: arg.id }],
    }),
  }),
});

export const {
  useGetDiscountsQuery,
  useLazyGetDiscountsQuery,
  useGetDiscountByIdQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useSetDiscountActiveMutation,
  useLinkCategoryMutation,
  useUnlinkCategoryMutation,
  useLinkProductMutation,
  useUnlinkProductMutation,
} = discountsApi;
