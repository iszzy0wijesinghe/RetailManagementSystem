import { baseApi } from "../../app/api/baseApi";
import type { LoginDto, RegisterDto, AuthResponseDto, MeResponse } from "./types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /api/auth/login
    login: build.mutation<AuthResponseDto, LoginDto>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          // fetch current user after login
          dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }));
        } catch {
          // ignore; UI will handle error
        }
      },
    }),

    // POST /api/auth/register
    register: build.mutation<void, RegisterDto>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
    }),

    // POST /api/auth/refresh
    refresh: build.mutation<AuthResponseDto, { refreshToken: string }>({
      query: (body) => ({
        url: "auth/refresh",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
        } catch {
          // ignore
        }
      },
    }),

    // POST /api/auth/logout
    logout: build.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
        body: { refreshToken: localStorage.getItem("refreshToken") ?? "" },
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    // GET /api/auth/me
    me: build.query<MeResponse, void>({
      query: () => "auth/me",
      // no providesTags: "Me" unless you add it to baseApi.tagTypes
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery, // add this export so your LoginPage import works
} = authApi;





// // src/features/auth/api.ts v1
// import { baseApi } from "../../app/api/baseApi";
// import type { LoginDto, AuthResponseDto, MeResponse } from "./types";

// export const authApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({
//     login: build.mutation<AuthResponseDto, LoginDto>({
//       query: (body) => ({ url: "auth/login", method: "POST", body }),
//     }),
//     me: build.query<MeResponse, void>({
//       query: () => "auth/me",
//       providesTags: ["Users"],
//     }),
//     refresh: build.mutation<AuthResponseDto, { refreshToken: string }>({
//       query: (body) => ({ url: "auth/refresh", method: "POST", body }),
//     }),
//     logout: build.mutation<void, { refreshToken: string }>({
//       query: (body) => ({ url: "auth/logout", method: "POST", body }),
//       invalidatesTags: ["Users"],
//     }),


//   }),
// });

// export const { useLoginMutation, useLazyMeQuery, useRefreshMutation, useLogoutMutation } = authApi;










// // src/features/auth/authApi.ts v2
// import { baseApi } from "../../app/api/baseApi";

// export type AuthResponse = {
//   accessToken: string;
//   refreshToken: string;
//   expiresAtUtc: string;
// };

// export type RegisterRequest = { userName: string; password: string; email?: string | null };
// export type LoginRequest = { userName: string; password: string };
// export type RefreshRequest = { refreshToken: string };
// export type LogoutRequest = { refreshToken: string };

// // ✅ The ONLY MeResponse used by the app (string, not nullable)
// export type MeResponse = {
//   userId: string;   // guaranteed non-null after transform
//   userName: string;
//   roles: string[];
// };

// // Raw shapes coming from .NET
// type RawAuthResponse = {
//   AccessToken: string;
//   RefreshToken: string;
//   ExpiresAtUtc: string;
// };

// type RawMeResponse = {
//   userId: string | null;   // backend might send null if claim missing
//   userName: string;
//   roles: string[];
// };

// export const persistAuth = (a: AuthResponse) => {
//   localStorage.setItem("accessToken", a.accessToken);
//   localStorage.setItem("refreshToken", a.refreshToken);
//   localStorage.setItem("expiresAtUtc", a.expiresAtUtc);
// };
// export const clearAuth = () => {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
//   localStorage.removeItem("expiresAtUtc");
// };

// export const authApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({
//     register: build.mutation<void, RegisterRequest>({
//       query: (body) => ({ url: "auth/register", method: "POST", body }),
//     }),

//     login: build.mutation<AuthResponse, LoginRequest>({
//       query: (body) => ({ url: "auth/login", method: "POST", body }),
//       transformResponse: (raw: RawAuthResponse): AuthResponse => ({
//         accessToken: raw.AccessToken,
//         refreshToken: raw.RefreshToken,
//         expiresAtUtc: raw.ExpiresAtUtc,
//       }),
//       async onQueryStarted(_arg, { queryFulfilled }) {
//         const { data } = await queryFulfilled;
//         persistAuth(data);
//       },
//     }),

//     refresh: build.mutation<AuthResponse, RefreshRequest>({
//       query: (body) => ({ url: "auth/refresh", method: "POST", body }),
//       transformResponse: (raw: RawAuthResponse): AuthResponse => ({
//         accessToken: raw.AccessToken,
//         refreshToken: raw.RefreshToken,
//         expiresAtUtc: raw.ExpiresAtUtc,
//       }),
//       async onQueryStarted(_arg, { queryFulfilled }) {
//         const { data } = await queryFulfilled;
//         persistAuth(data);
//       },
//     }),

//     logout: build.mutation<void, LogoutRequest>({
//       query: (body) => ({ url: "auth/logout", method: "POST", body }),
//       async onQueryStarted(_arg, { queryFulfilled }) {
//         try { await queryFulfilled; } finally { clearAuth(); }
//       },
//     }),

//     // ✅ Coerce userId to string so it matches your app type
//     me: build.query<MeResponse, void>({
//       query: () => "auth/me",
//       transformResponse: (raw: RawMeResponse): MeResponse => ({
//         userId: raw.userId ?? "",  // <- fix: never null
//         userName: raw.userName,
//         roles: raw.roles ?? [],
//       }),
//     }),
//   }),
//   overrideExisting: true,
// });

// export const {
//   useRegisterMutation,
//   useLoginMutation,
//   useRefreshMutation,
//   useLogoutMutation,
//   useMeQuery,
//   useLazyMeQuery,
// } = authApi;
