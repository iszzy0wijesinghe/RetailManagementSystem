// src/features/users/components/AddUserModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import {
  useCreateUserMutation,
  useGetRolesQuery,
  useLinkRoleMutation,
  useUnlinkRoleMutation,
  useLazyGetUsersQuery,
} from "../api";
import type { RegisterDto } from "../types";
import "./AddUserModal.css";

type Props = { open: boolean; onClose: () => void; onCreated?: () => void };

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [create, { isLoading }] = useCreateUserMutation();
  const { data: roles = [], isFetching: rolesLoading } = useGetRolesQuery();
  const [linkRole] = useLinkRoleMutation();
  const [unlinkRole] = useUnlinkRoleMutation();
  const [fetchUsers] = useLazyGetUsersQuery();

  const [form, setForm] = useState<RegisterDto>({
    userName: "",
    password: "",
    email: "",
  });
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefer "User" -> else first role
  const defaultUserRole = useMemo(
    () => roles.find((r) => r.name.toLowerCase() === "user") ?? null,
    [roles]
  );

  useEffect(() => {
    if (open && roles.length > 0) {
      setSelectedRoleId(
        (prev) => prev ?? defaultUserRole?.roleId ?? roles[0].roleId
      );
    }
  }, [open, roles, defaultUserRole]);

  if (!open) return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.userName.trim()) e.userName = "Username required";
    if (!form.password.trim()) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (!validate()) return;

    // 1) Create user (backend may return void or userId)
    let newUserId: number | undefined;
    try {
      const res: any = await create({
        ...form,
        email: form.email?.trim() || null,
      }).unwrap();
      // accept either numeric id or void
      if (typeof res === "number") newUserId = res;
    } catch (e: any) {
      alert(e?.data ?? "Failed to create user");
      return;
    }

    // 2) If no id returned, look up by username (include inactive to be safe)
    if (!newUserId) {
      const found = await fetchUsers({
        q: form.userName.trim(),
        includeInactive: true,
      }).unwrap();
      const match = (found ?? []).find(
        (u) => u.userName.toLowerCase() === form.userName.trim().toLowerCase()
      );
      newUserId = match?.userId;
    }

    // 3) Link to selected role, and if not "User", unlink default "User"
    if (newUserId && selectedRoleId) {
      const chosen = roles.find((r) => r.roleId === selectedRoleId) ?? null;

      try {
        if (chosen && (!defaultUserRole || chosen.roleId !== defaultUserRole.roleId)) {
          await linkRole({ id: newUserId, roleId: chosen.roleId }).unwrap();
        }
        if (defaultUserRole && chosen && chosen.roleId !== defaultUserRole.roleId) {
          try {
            await unlinkRole({ id: newUserId, roleId: defaultUserRole.roleId }).unwrap();
          } catch {
            /* ignore if not linked */
          }
        }
      } catch (e: any) {
        // Don’t block creating—role linking may fail, user still created
        console.warn("Role link/unlink failed:", e);
      }
    }

    onCreated?.();
    onClose();
  }

  return createPortal(
    <div className="user-modal__overlay" onClick={onClose}>
      <div
        className="user-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="user-modal__header">
          <div className="user-title">Register New User</div>
          <button className="user-close" onClick={onClose}><FiX /></button>
        </div>

        <form className="user-modal__body" onSubmit={submit}>
          <div className="grid-2">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
              />
              {errors.userName && <div className="err">{errors.userName}</div>}
            </div>

            <div>
              <label className="label">Email (optional)</label>
              <input
                className="input"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <div className="err">{errors.password}</div>}
            </div>

            <div>
              <label className="label">Role</label>
              <select
                className="input"
                disabled={rolesLoading || roles.length === 0}
                value={selectedRoleId ?? ""}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>{r.name}</option>
                ))}
              </select>
              {rolesLoading && <div className="muted">Loading roles…</div>}
              {!rolesLoading && roles.length === 0 && (
                <div className="muted">No roles found.</div>
              )}
            </div>
          </div>
        </form>

        <div className="user-modal__footer">
          <button className="btn-chip" onClick={onClose} type="button">Cancel</button>
          <button className="btn-chip btn-chip--secondary" onClick={() => submit()} disabled={isLoading}>
            {isLoading ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}


// import { useState } from "react";
// import { createPortal } from "react-dom";
// import { FiX } from "react-icons/fi";
// import { useCreateUserMutation } from "../api";
// import type { RegisterDto } from "../types";
// import "./AddUserModal.css";

// type Props = { open: boolean; onClose: () => void; onCreated?: () => void };

// export default function AddUserModal({ open, onClose, onCreated }: Props) {
//   const [create, { isLoading }] = useCreateUserMutation();
//   const [form, setForm] = useState<RegisterDto>({ userName: "", password: "", email: "" });
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   if (!open) return null;
//   const modalRoot = document.getElementById("modal-root") ?? document.body;

//   function validate() {
//     const e: Record<string, string> = {};
//     if (!form.userName.trim()) e.userName = "Username required";
//     if (!form.password.trim()) e.password = "Password required";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   }

//   async function submit(ev?: React.FormEvent) {
//     ev?.preventDefault();
//     if (!validate()) return;
//     await create({ ...form, email: form.email?.trim() || null }).unwrap();
//     onCreated?.();
//     onClose();
//   }

//   return createPortal(
//     <div className="user-modal__overlay" onClick={onClose}>
//       <div className="user-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
//         <div className="user-modal__header">
//           <div className="user-title">Register New User</div>
//           <button className="user-close" onClick={onClose}><FiX /></button>
//         </div>

//         <form className="user-modal__body" onSubmit={submit}>
//           <div className="grid-2">
//             <div>
//               <label className="label">Username</label>
//               <input className="input" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
//               {errors.userName && <div className="err">{errors.userName}</div>}
//             </div>

//             <div>
//               <label className="label">Email (optional)</label>
//               <input className="input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
//             </div>

//             <div>
//               <label className="label">Password</label>
//               <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
//               {errors.password && <div className="err">{errors.password}</div>}
//             </div>
//           </div>
//         </form>

//         <div className="user-modal__footer">
//           <button className="btn-chip" onClick={onClose} type="button">Cancel</button>
//           <button className="btn-chip btn-chip--secondary" onClick={() => submit()} disabled={isLoading}>
//             {isLoading ? "Saving…" : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>,
//     modalRoot
//   );
// }
