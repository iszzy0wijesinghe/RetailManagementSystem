// src/features/users/pages/UsersPage.tsx
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiEdit,
} from "react-icons/fi";
import {
  useGetUsersQuery,
  useSetUserActiveMutation,
  useDeleteUserMutation,
} from "../api";
import type { UserListItem } from "../types";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import "./UsersPage.css";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const {
    data: users = [],
    isFetching,
    refetch,
  } = useGetUsersQuery({ q, includeInactive });

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [setActive, { isLoading: toggling }] = useSetUserActiveMutation();
  const [delUser] = useDeleteUserMutation();

  const rows = useMemo(() => users, [users]);

  return (
    <div className="users-page">
      <div className="users-head">
        <h2 className="users-title">User Management</h2>
        <div className="users-actions">
          <button className="btn-chip" onClick={() => refetch()}>
            Refresh
          </button>
          <button
            className="btn-chip btn-chip--secondary"
            onClick={() => setShowAdd(true)}
          >
            <FiPlus /> New User
          </button>
        </div>
      </div>

      <div className="users-filters">
        <div className="rms-search__bar" style={{ maxWidth: 420 }}>
          <FiSearch className="rms-search__icon" />
          <input
            className="rms-search__input"
            placeholder="Search by username or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="rms-search__submit" onClick={() => refetch()}>
            Search
          </button>
        </div>

        <label className="switch-inline">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span>Include inactive</span>
        </label>

        <div className="users-total">Total: {rows.length}</div>
      </div>

      <div className="card card--table">
        <div className="card-body scroll-shell">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
                <th style={{ width: 120 }} className="text-center">
                  Status
                </th>
                <th style={{ width: 160 }} className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u: UserListItem) => (
                <tr key={u.userId}>
                  <td>{u.userId}</td>
                  <td className="truncate1">{u.userName}</td>
                  <td className="truncate1">{u.email ?? "-"}</td>
                  <td className="truncate1">
                    {u.roles?.length ? u.roles.join(", ") : "-"}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        u.isActive ? "badge--ok" : "badge--warn"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="row-actions">
                      <button
                        className="btn-mini"
                        title="Edit"
                        onClick={() => setEditId(u.userId)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-mini"
                        title={u.isActive ? "Deactivate" : "Activate"}
                        onClick={() =>
                          setActive({ id: u.userId, value: !u.isActive })
                        }
                      >
                        {u.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button
                        className="btn-mini btn-mini--danger"
                        title="Delete"
                        onClick={async () => {
                          if (!confirm("Delete this user?")) return;
                          await delUser(u.userId).unwrap();
                          refetch();
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isFetching && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center"
                    style={{ padding: 22 }}
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddUserModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onCreated={() => refetch()}
        />
      )}
      {editId !== null && (
        <EditUserModal
          id={editId}
          show={true}
          onClose={() => setEditId(null)}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  );
}
