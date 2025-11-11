// src/features/users/components/EditUserModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiSave, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useSetUserActiveMutation,
  useGetRolesQuery,
  useLinkRoleMutation,
  useUnlinkRoleMutation,
} from "../api";
import type { UserDetailsDto, UserUpdateDto, RoleListItem } from "../types";
import "./EditUserModal.css";

type Props = {
  id: number | null;
  show: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

type LocalForm = {
  userName: string;
  email: string | null;
  newPassword: string;
};

export default function EditUserModal({ id, show, onClose, onUpdated }: Props) {
  const skip = !show || !id;

  const { data, isFetching, isError, refetch } = useGetUserByIdQuery(id ?? 0, { skip });
  const { data: roles = [] } = useGetRolesQuery();
  const [update, { isLoading: saving }] = useUpdateUserMutation();
  const [setActive, { isLoading: toggling }] = useSetUserActiveMutation();
  const [linkRole] = useLinkRoleMutation();
  const [unlinkRole] = useUnlinkRoleMutation();

  const [form, setForm] = useState<LocalForm>({
    userName: "",
    email: null,
    newPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentRoleIds, setCurrentRoleIds] = useState<number[]>([]);
  const [assignRoleId, setAssignRoleId] = useState<number | "">("");

  const roleByName = useMemo(() => {
    const m = new Map<string, RoleListItem>();
    roles.forEach((r) => m.set(r.name, r));
    return m;
  }, [roles]);

  useEffect(() => {
    if (!data || !show) return;
    const u: UserDetailsDto = data;

    setForm({
      userName: u.userName,
      email: u.email ?? null,
      newPassword: "",
    });

    const explicitIds = (u as any).roleIds as number[] | undefined;
    if (explicitIds && Array.isArray(explicitIds)) {
      setCurrentRoleIds(explicitIds);
    } else if (Array.isArray(u.roles) && u.roles.length > 0) {
      const inferred = u.roles
        .map((name) => roleByName.get(name)?.roleId)
        .filter((x): x is number => typeof x === "number");
      setCurrentRoleIds(inferred);
    } else {
      setCurrentRoleIds([]);
    }

    setErrors({});
  }, [data, show, roleByName]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.userName.trim()) e.userName = "Username is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!id || !validate()) return;

    const body: UserUpdateDto = {
      userName: form.userName.trim(),
      email: form.email ? form.email.trim() : null,
      newPassword: form.newPassword ? form.newPassword : null,
    };

    try {
      await update({ id, body }).unwrap();
      onUpdated?.();
      onClose();
    } catch (e: any) {
      alert(e?.data ?? "Failed to update user");
      console.error(e);
    }
  }

  async function toggleActive(next: boolean) {
    if (!id) return;
    try {
      await setActive({ id, value: next }).unwrap();
      onUpdated?.();
      refetch();
    } catch (e: any) {
      alert(e?.data ?? "Failed to toggle active");
    }
  }

  async function handleRoleToggle(roleId: number, checked: boolean) {
    if (!id) return;
    try {
      if (checked) {
        await linkRole({ id, roleId }).unwrap();
        setCurrentRoleIds((x) => Array.from(new Set([...x, roleId])));
      } else {
        await unlinkRole({ id, roleId }).unwrap();
        setCurrentRoleIds((x) => x.filter((rid) => rid !== roleId));
      }
    } catch (e: any) {
      alert(e?.data ?? "Failed to update roles");
    }
  }

  async function assignRole() {
    if (!id || assignRoleId === "") return;
    if (currentRoleIds.includes(assignRoleId)) return;
    try {
      await linkRole({ id, roleId: assignRoleId }).unwrap();
      setCurrentRoleIds((x) => [...x, assignRoleId]);
    } catch (e: any) {
      alert(e?.data ?? "Failed to assign role");
    }
  }

  if (!show) return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div className="useredit-modal__overlay" onClick={onClose}>
      <div className="useredit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="useredit-modal__header">
          <div className="useredit-title">
            {isFetching ? "Loading…" : isError ? "Error" : `Edit User #${data?.userId ?? ""}`}
          </div>
          <div className="head-actions">
            {!isFetching && data && (
              <button
                className={`chip ${data.isActive ? "chip--ok" : "chip--warn"}`}
                type="button"
                onClick={() => toggleActive(!data.isActive)}
                disabled={toggling}
                title={data.isActive ? "Deactivate" : "Activate"}
              >
                {data.isActive ? <FiToggleRight /> : <FiToggleLeft />} {data.isActive ? "Active" : "Inactive"}
              </button>
            )}
            <button className="useredit-close" onClick={onClose}><FiX /></button>
          </div>
        </div>

        <form className="useredit-modal__body" onSubmit={onSave}>
          <div className="grid-2">
            <div>
              <label className="label">Username</label>
              <input
                className={`input ${errors.userName ? "is-invalid" : ""}`}
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                readOnly
              />
              {errors.userName && <div className="err">{errors.userName}</div>}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className={`input ${errors.email ? "is-invalid" : ""}`}
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <div className="err">{errors.email}</div>}
            </div>

            <div>
              <label className="label">New Password (optional)</label>
              <input
                type="password"
                className="input"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          {/* Assign role dropdown + add button */}
          <div className="roles-box">
            <div className="roles-head">Roles</div>

            <div className="roles-assign">
              <select
                className="input"
                value={assignRoleId}
                onChange={(e) =>
                  setAssignRoleId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">— Select a role to assign —</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>{r.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-chip"
                onClick={assignRole}
                disabled={assignRoleId === "" || isFetching}
                style={{ marginLeft: 8 }}
              >
                Add Role
              </button>
            </div>

            <div className="roles-grid">
              {roles.map((r) => {
                const checked = currentRoleIds.includes(r.roleId);
                return (
                  <label key={r.roleId} className="role-chip">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleRoleToggle(r.roleId, e.target.checked)}
                    />
                    <span>{r.name}</span>
                  </label>
                );
              })}
              {roles.length === 0 && <div className="muted">No roles defined.</div>}
            </div>
          </div>
        </form>

        <div className="useredit-modal__footer">
          <button className="btn-chip" type="button" onClick={onClose}>Close</button>
          <button className="btn-chip btn-chip--secondary" onClick={onSave as any} disabled={saving || isFetching}>
            <FiSave /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}








// // src/features/users/components/EditUserModal.tsx
// import { useEffect, useMemo, useState } from "react";
// import { createPortal } from "react-dom";
// import { FiX, FiSave, FiToggleLeft, FiToggleRight } from "react-icons/fi";
// import {
//   useGetUserByIdQuery,
//   useUpdateUserMutation,
//   useSetUserActiveMutation,
//   useGetRolesQuery,
//   useLinkRoleMutation,
//   useUnlinkRoleMutation,
// } from "../api";
// import type { UserDetailsDto, UserUpdateDto, RoleListItem } from "../types";
// import "./EditUserModal.css";

// type Props = {
//   id: number | null;
//   show: boolean;
//   onClose: () => void;
//   onUpdated?: () => void;
// };

// type LocalForm = {
//   userName: string;
//   email: string | null;
//   newPassword: string;
// };

// export default function EditUserModal({ id, show, onClose, onUpdated }: Props) {
//   const skip = !show || !id;

//   const { data, isFetching, isError, refetch } = useGetUserByIdQuery(id ?? 0, { skip });
//   const { data: roles = [] } = useGetRolesQuery();
//   const [update, { isLoading: saving }] = useUpdateUserMutation();
//   const [setActive, { isLoading: toggling }] = useSetUserActiveMutation();
//   const [linkRole] = useLinkRoleMutation();
//   const [unlinkRole] = useUnlinkRoleMutation();

//   // -------- form --------
//   const [form, setForm] = useState<LocalForm>({
//     userName: "",
//     email: null,
//     newPassword: "",
//   });
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   // -------- roles (ids) currently linked to the user --------
//   const [currentRoleIds, setCurrentRoleIds] = useState<number[]>([]);

//   // Build a map for quick role name -> id lookup
//   const roleByName = useMemo(() => {
//     const m = new Map<string, RoleListItem>();
//     roles.forEach(r => m.set(r.name, r));
//     return m;
//   }, [roles]);

//   // hydrate when API data (or roles) change
//   useEffect(() => {
//     if (!data || !show) return;

//     const u: UserDetailsDto = data;

//     setForm({
//       userName: u.userName,
//       email: u.email ?? null,
//       newPassword: "",
//     });

//     // If API provides roleIds, use them; otherwise infer from role names
//     const explicitIds = (u as any).roleIds as number[] | undefined;
//     if (explicitIds && Array.isArray(explicitIds)) {
//       setCurrentRoleIds(explicitIds);
//     } else if (Array.isArray(u.roles) && u.roles.length > 0) {
//       const inferred = u.roles
//         .map(name => roleByName.get(name)?.roleId)
//         .filter((x): x is number => typeof x === "number");
//       setCurrentRoleIds(inferred);
//     } else {
//       setCurrentRoleIds([]);
//     }

//     setErrors({});
//   }, [data, show, roleByName]);

//   function validate() {
//     const e: Record<string, string> = {};
//     if (!form.userName.trim()) e.userName = "Username is required";
//     if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   }

//   async function onSave(ev: React.FormEvent) {
//     ev.preventDefault();
//     if (!id || !validate()) return;

//     const body: UserUpdateDto = {
//       userName: form.userName.trim(),
//       email: form.email ? form.email.trim() : null,
//       newPassword: form.newPassword ? form.newPassword : null,
//     };

//     try {
//       await update({ id, body }).unwrap();
//       onUpdated?.();
//       onClose(); // close after save as requested earlier
//     } catch (e: any) {
//       alert(e?.data ?? "Failed to update user");
//       console.error(e);
//     }
//   }

//   async function toggleActive(next: boolean) {
//     if (!id) return;
//     try {
//       await setActive({ id, value: next }).unwrap();
//       onUpdated?.();
//       refetch();
//     } catch (e: any) {
//       alert(e?.data ?? "Failed to toggle active");
//     }
//   }

//   // Role toggle
//   async function handleRoleToggle(roleId: number, checked: boolean) {
//     if (!id) return;
//     try {
//       if (checked) {
//         await linkRole({ id, roleId }).unwrap();
//         setCurrentRoleIds(x => Array.from(new Set([...x, roleId])));
//       } else {
//         await unlinkRole({ id, roleId }).unwrap();
//         setCurrentRoleIds(x => x.filter(rid => rid !== roleId));
//       }
//     } catch (e: any) {
//       alert(e?.data ?? "Failed to update roles");
//     }
//   }

//   if (!show) return null;
//   const modalRoot = document.getElementById("modal-root") ?? document.body;

//   return createPortal(
//     <div className="useredit-modal__overlay" onClick={onClose}>
//       <div
//         className="useredit-modal"
//         onClick={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <div className="useredit-modal__header">
//           <div className="useredit-title">
//             {isFetching ? "Loading…" : isError ? "Error" : `Edit User #${data?.userId ?? ""}`}
//           </div>
//           <div className="head-actions">
//             {!isFetching && data && (
//               <button
//                 className={`chip ${data.isActive ? "chip--ok" : "chip--warn"}`}
//                 type="button"
//                 onClick={() => toggleActive(!data.isActive)}
//                 disabled={toggling}
//                 title={data.isActive ? "Deactivate" : "Activate"}
//               >
//                 {data.isActive ? <FiToggleRight /> : <FiToggleLeft />} {data.isActive ? "Active" : "Inactive"}
//               </button>
//             )}
//             <button className="useredit-close" onClick={onClose}><FiX /></button>
//           </div>
//         </div>

//         <form className="useredit-modal__body" onSubmit={onSave}>
//           <div className="grid-2">
//             <div>
//               <label className="label">Username</label>
//               <input
//                 className={`input ${errors.userName ? "is-invalid" : ""}`}
//                 value={form.userName}
//                 onChange={(e) => setForm({ ...form, userName: e.target.value })}
//                 readOnly // keep read-only in UI, but still send with update
//               />
//               {errors.userName && <div className="err">{errors.userName}</div>}
//             </div>

//             <div>
//               <label className="label">Email</label>
//               <input
//                 className={`input ${errors.email ? "is-invalid" : ""}`}
//                 value={form.email ?? ""}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//               />
//               {errors.email && <div className="err">{errors.email}</div>}
//             </div>

//             <div>
//               <label className="label">New Password (optional)</label>
//               <input
//                 type="password"
//                 className="input"
//                 value={form.newPassword}
//                 onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
//                 placeholder="Leave blank to keep current password"
//               />
//             </div>
//           </div>

//           <div className="roles-box">
//             <div className="roles-head">Roles</div>
//             <div className="roles-grid">
//               {roles.map((r) => {
//                 const checked = currentRoleIds.includes(r.roleId);
//                 return (
//                   <label key={r.roleId} className="role-chip">
//                     <input
//                       type="checkbox"
//                       checked={checked}
//                       onChange={(e) => handleRoleToggle(r.roleId, e.target.checked)}
//                     />
//                     <span>{r.name}</span>
//                   </label>
//                 );
//               })}
//               {roles.length === 0 && <div className="muted">No roles defined.</div>}
//             </div>
//           </div>
//         </form>

//         <div className="useredit-modal__footer">
//           <button className="btn-chip" type="button" onClick={onClose}>Close</button>
//           <button
//             className="btn-chip btn-chip--secondary"
//             onClick={onSave as any}
//             disabled={saving || isFetching}
//           >
//             <FiSave /> {saving ? "Saving…" : "Save Changes"}
//           </button>
//         </div>
//       </div>
//     </div>,
//     modalRoot
//   );
// }
