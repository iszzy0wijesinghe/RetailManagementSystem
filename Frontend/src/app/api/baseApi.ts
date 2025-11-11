// src/app/api/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

const API_ROOT =
  (import.meta.env.VITE_API_URL ?? "https://localhost:7207") + "/api";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_ROOT,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ['Products', 'Categories', 'Inventory', 'Orders', 'Pos', 'Discount', 'Users'],
  endpoints: () => ({}),
});




// // src/app/api/baseApi.ts
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
// import type { RootState } from '../store';
// import { setCredentials, logout } from '../../features/auth/authSlice';
// import type { AuthResponseDto } from '../../features/auth/types';

// // Keep using your existing env var. Example .env:
// // VITE_API_BASE_URL=https://localhost:7207/api
// const RAW = import.meta.env.VITE_API_BASE_URL ?? '';
// // strip trailing slashes to avoid // in requests
// const baseUrl = RAW.replace(/\/+$/, '');

// // Base query that attaches Authorization header when we have an access token
// const rawBaseQuery = fetchBaseQuery({
//   baseUrl, // e.g. https://localhost:7207/api
//   prepareHeaders: (headers, { getState }) => {
//     const token = (getState() as RootState).auth.accessToken;
//     if (token) headers.set('authorization', `Bearer ${token}`);
//     return headers;
//   },
// });

// // Wrapper that auto-refreshes on 401 using /auth/refresh, then retries the original request
// const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
//   args,
//   api,
//   extraOptions
// ) => {
//   let result = await rawBaseQuery(args, api, extraOptions);

//   if (result.error && result.error.status === 401) {
//     const state = api.getState() as RootState;
//     const refreshToken = state.auth.refreshToken;

//     if (!refreshToken) {
//       api.dispatch(logout());
//       return result;
//     }

//     const refreshRes = await rawBaseQuery(
//       { url: 'auth/refresh', method: 'POST', body: { refreshToken } },
//       api,
//       extraOptions
//     );

//     if (refreshRes.data) {
//       const { access, refresh, exp } = refreshRes.data as AuthResponseDto;
//       api.dispatch(setCredentials({ access, refresh, exp }));
//       // retry original request with fresh token
//       result = await rawBaseQuery(args, api, extraOptions);
//     } else {
//       api.dispatch(logout());
//     }
//   }

//   return result;
// };

// export const baseApi = createApi({
//   reducerPath: 'api',
//   baseQuery: baseQueryWithReauth,
//   tagTypes: ['Products', 'Categories', 'Inventory', 'Orders', 'Pos', 'Discount', 'Users'] as const,
//   endpoints: () => ({}),
// });
