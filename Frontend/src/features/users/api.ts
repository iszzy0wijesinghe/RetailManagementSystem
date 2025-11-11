// src/features/users/api.ts
import { baseApi } from "../../app/api/baseApi";
import type {
  UserListItem,
  UserDetailsDto,
  RegisterDto,
  UserUpdateDto,
  RoleListItem,
} from "./types";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<
      UserListItem[],
      { includeInactive?: boolean; q?: string } | void
    >({
      query: (params) => ({
        url: "auth/users",
        params: {
          includeInactive: params?.includeInactive ?? false,
          q: params?.q ?? undefined,
        },
      }),
      providesTags: (res) =>
        res
          ? [
              ...res.map((u) => ({ type: "Users" as const, id: u.userId })),
              { type: "Users" as const, id: "LIST" },
            ]
          : [{ type: "Users" as const, id: "LIST" }],
    }),

    getUserById: build.query<UserDetailsDto, number>({
      query: (id) => `auth/users/${id}`,
      providesTags: (_res, _e, id) => [{ type: "Users" as const, id }],
    }),

    createUser: build.mutation<number, RegisterDto>({
      query: (body) => ({ url: "auth/register", method: "POST", body }),
      invalidatesTags: [{ type: "Users" as const, id: "LIST" }],
    }),

    updateUser: build.mutation<void, { id: number; body: UserUpdateDto }>({
      query: ({ id, body }) => ({
        url: `auth/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Users" as const, id: arg.id },
        { type: "Users" as const, id: "LIST" },
      ],
    }),

    setUserActive: build.mutation<void, { id: number; value: boolean }>({
      query: ({ id, value }) => ({
        url: `auth/users/${id}/active`,
        method: "PUT",
        params: { value },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Users" as const, id: arg.id },
        { type: "Users" as const, id: "LIST" },
      ],
    }),

    deleteUser: build.mutation<void, number>({
      query: (id) => ({ url: `auth/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Users" as const, id: "LIST" }],
    }),

    getRoles: build.query<RoleListItem[], void>({
      query: () => `auth/roles`,
    }),

    linkRole: build.mutation<void, { id: number; roleId: number }>({
      query: ({ id, roleId }) => ({
        url: `auth/users/${id}/roles`,
        method: "POST",
        body: { roleId },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Users" as const, id: arg.id },
      ],
    }),

    unlinkRole: build.mutation<void, { id: number; roleId: number }>({
      query: ({ id, roleId }) => ({
        url: `auth/users/${id}/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Users" as const, id: arg.id },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSetUserActiveMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useLinkRoleMutation,
  useUnlinkRoleMutation,
} = usersApi;
