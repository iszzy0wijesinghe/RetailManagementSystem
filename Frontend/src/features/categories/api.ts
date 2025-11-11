import { baseApi } from "../../app/api/baseApi";
import type {
  CategoryListItem,
  CategoryDetailsDto,
  CategoryCreateDto,
  CategoryUpdateDto,
} from "./types";

const TAG = "Categories" as const;

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<CategoryListItem[], { includeInactive?: boolean } | void>({
      query: (params) => ({
        url: "categories",
        params: { includeInactive: params?.includeInactive ?? false },
      }),
      providesTags: (res) =>
        res
          ? [
              ...res.map((c) => ({ type: TAG, id: c.categoryId } as const)),
              { type: TAG, id: "LIST" as const },
            ]
          : [{ type: TAG, id: "LIST" as const }],
    }),

    getCategoryById: build.query<CategoryDetailsDto, number>({
      query: (id) => `categories/${id}`,
      providesTags: (_res, _e, id) => [{ type: TAG, id } as const],
    }),

    createCategory: build.mutation<number, CategoryCreateDto>({
      query: (body) => ({ url: "categories", method: "POST", body }),
      invalidatesTags: [{ type: TAG, id: "LIST" } as const],
    }),

    updateCategory: build.mutation<void, { id: number; body: CategoryUpdateDto }>({
      query: ({ id, body }) => ({ url: `categories/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, arg) =>
        [{ type: TAG, id: arg.id } as const, { type: TAG, id: "LIST" as const }],
    }),

    // Controller's DELETE marks inactive if safe
    deactivateCategory: build.mutation<void, number>({
      query: (id) => ({ url: `categories/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) =>
        [{ type: TAG, id } as const, { type: TAG, id: "LIST" as const }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeactivateCategoryMutation,
} = categoriesApi;















// import { baseApi } from "../../app/api/baseApi";
// import type {
//   CategoryListItem,
//   CategoryDetailsDto,
//   CategoryCreateDto,
//   CategoryUpdateDto,
// } from "./types";

// export const categoriesApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({
//     getCategories: build.query<CategoryListItem[], { includeInactive?: boolean } | void>({
//       query: (params) => ({
//         url: "categories",
//         params: { includeInactive: params?.includeInactive ?? false },
//       }),
//       providesTags: (res) =>
//         res
//           ? [
//               ...res.map((c) => ({ type: "Category" as const, id: c.categoryId })),
//               { type: "Category" as const, id: "LIST" },
//             ]
//           : [{ type: "Category" as const, id: "LIST" }],
//     }),

//     getCategoryById: build.query<CategoryDetailsDto, number>({
//       query: (id) => `categories/${id}`,
//       providesTags: (_res, _e, id) => [{ type: "Category", id }],
//     }),

//     createCategory: build.mutation<number, CategoryCreateDto>({
//       query: (body) => ({ url: "categories", method: "POST", body }),
//       invalidatesTags: [{ type: "Category", id: "LIST" }],
//     }),

//     updateCategory: build.mutation<void, { id: number; body: CategoryUpdateDto }>({
//       query: ({ id, body }) => ({ url: `categories/${id}`, method: "PUT", body }),
//       invalidatesTags: (_r, _e, arg) => [{ type: "Category", id: arg.id }, { type: "Category", id: "LIST" }],
//     }),

//     // Controller's DELETE marks inactive if safe
//     deactivateCategory: build.mutation<void, number>({
//       query: (id) => ({ url: `categories/${id}`, method: "DELETE" }),
//       invalidatesTags: (_r, _e, id) => [{ type: "Category", id }, { type: "Category", id: "LIST" }],
//     }),
//   }),
// });

// export const {
//   useGetCategoriesQuery,
//   useLazyGetCategoriesQuery,
//   useGetCategoryByIdQuery,
//   useCreateCategoryMutation,
//   useUpdateCategoryMutation,
//   useDeactivateCategoryMutation,
// } = categoriesApi;
