import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userName: string | null;
  roles: string[];
};

const initialState: AuthState = {
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  userName: null,
  roles: [],
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {

    setAuth(
      state,
      action: PayloadAction<{
        accessToken: string | null;
        refreshToken: string | null;
        userName?: string | null;
        roles?: string[];
      }>
    ) {
      const { accessToken, refreshToken, userName = state.userName, roles = state.roles } =
        action.payload;

      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.userName = userName ?? null;
      state.roles = roles ?? [];


      if (accessToken) localStorage.setItem("accessToken", accessToken);
      else localStorage.removeItem("accessToken");

      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      else localStorage.removeItem("refreshToken");
    },


    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.userName = null;
      state.roles = [];
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("expiresAtUtc");
    },

    // optional: update profile name/roles after /auth/me
    setProfile(state, action: PayloadAction<{ userName: string; roles: string[] }>) {
      state.userName = action.payload.userName;
      state.roles = action.payload.roles ?? [];
    },
  },
});

export const { setAuth, logout, setProfile } = slice.actions;
export default slice.reducer;




// // src/features/auth/authSlice.ts
// import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
// import type { MeResponse } from "./types";

// type AuthState = {
//   accessToken: string | null;
//   refreshToken: string | null;
//   expiresAtUtc: string | null;
//   user: MeResponse | null;
// };

// const initial: AuthState = {
//   accessToken: localStorage.getItem("accessToken"),
//   refreshToken: localStorage.getItem("refreshToken"),
//   expiresAtUtc: localStorage.getItem("expiresAtUtc"),
//   user: null,
// };

// const slice = createSlice({
//   name: "auth",
//   initialState: initial,
//   reducers: {
//     setCredentials(state, action: PayloadAction<{ accessToken: string; refreshToken: string; expiresAtUtc: string }>) {
//       const { accessToken, refreshToken, expiresAtUtc } = action.payload;
//       state.accessToken = accessToken;
//       state.refreshToken = refreshToken;
//       state.expiresAtUtc = expiresAtUtc;
//       localStorage.setItem("accessToken", accessToken);
//       localStorage.setItem("refreshToken", refreshToken);
//       localStorage.setItem("expiresAtUtc", expiresAtUtc);
//     },
//     setUser(state, action: PayloadAction<MeResponse | null>) {
//       state.user = action.payload;
//     },
//     clearAuth(state) {
//       state.accessToken = state.refreshToken = state.expiresAtUtc = null;
//       state.user = null;
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("refreshToken");
//       localStorage.removeItem("expiresAtUtc");
//     },
//   },
// });

// export const { setCredentials, setUser, clearAuth } = slice.actions;
// export default slice.reducer;
