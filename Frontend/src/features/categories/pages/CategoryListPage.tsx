import { useMemo, useState } from "react";
import { useGetCategoriesQuery, useDeactivateCategoryMutation } from "../api";
import type { CategoryListItem } from "../types";

import AddCategoryModal from "./CategoryAddPage";
import EditCategoryModal from "./CategoryEditPage";

import {
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiEdit2,
  FiPower,
} from "react-icons/fi";
import "./CategoriesPage.css";

type StatusFilter = "all" | "active" | "inactive";

export default function CategoriesPage() {
  // segmented status filter like your Product page
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // includeInactive param follows the status
  const includeInactiveParam = status !== "active";

  const {
    data: rows = [],
    isFetching,
    refetch,
  } = useGetCategoriesQuery({ includeInactive: includeInactiveParam });

  const [deactivate, { isLoading: deactivating }] =
    useDeactivateCategoryMutation();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const nameById = useMemo(() => {
    const map = new Map<number, string>();
    rows.forEach((r: CategoryListItem) => map.set(r.categoryId, r.name));
    return map;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      // status filter
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;

      if (!q) return true;

      const idText = `#${r.categoryId}`;
      const parentText = r.parentCategoryId
        ? nameById.get(r.parentCategoryId)?.toLowerCase() ??
          `#${r.parentCategoryId}`
        : "";

      return (
        r.name.toLowerCase().includes(q) ||
        idText.toLowerCase().includes(q) ||
        parentText.includes(q)
      );
    });
  }, [rows, status, query, nameById]);

  async function handleDeactivate(id: number) {
    if (
      !confirm(
        "Deactivate this category? (Only allowed when no products are using it)"
      )
    )
      return;
    try {
      await deactivate(id).unwrap();
      refetch();
    } catch (e: any) {
      alert(e?.data ?? "Failed to deactivate category");
    }
  }

  return (
    <div className="catv2-page">
      <div className="catv2-header">
        <h1>Category Management</h1>
        <div className="header-actions">
          <button className="btn-dark" onClick={() => setShowAdd(true)}>
            <FiPlus /> Add Category
          </button>
        </div>
      </div>

      {/* toolbar card */}
      <div className="toolbar-card">
        <div className="search-wrap">
          <FiSearch className="search-ico" />
          <input
            placeholder="Search by ID, Name or Parent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-dark ghost" onClick={() => refetch()}>
            <FiRefreshCw />
            {isFetching ? " Refreshing…" : " Search"}
          </button>
        </div>

        <div className="segmented">
          <button
            className={`seg ${status === "all" ? "active" : ""}`}
            onClick={() => setStatus("all")}
          >
            All
          </button>
          <button
            className={`seg ${status === "active" ? "active" : ""}`}
            onClick={() => setStatus("active")}
          >
            Active
          </button>
          <button
            className={`seg ${status === "inactive" ? "active" : ""}`}
            onClick={() => setStatus("inactive")}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* table card */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="catv2-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Name</th>
                <th>Parent</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ width: 220 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((d) => (
                <tr key={d.categoryId}>
                  <td>#{d.categoryId}</td>
                  <td>
                    <div className="ellipsis">{d.name}</div>
                  </td>
                  <td>
                    <div className="ellipsis">
                      {d.parentCategoryId
                        ? nameById.get(d.parentCategoryId) ??
                          `#${d.parentCategoryId}`
                        : "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`pill ${d.isActive ? "pill-ok" : "pill-warn"}`}
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-light"
                        onClick={() => setEditId(d.categoryId)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        disabled={!d.isActive || deactivating}
                        onClick={() => handleDeactivate(d.categoryId)}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <h4>No categories</h4>
                      <p>Try switching the filter or create a new category.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddCategoryModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            refetch();
          }}
        />
      )}

      {editId !== null && (
        <EditCategoryModal
          id={editId}
          open={true}
          onClose={() => setEditId(null)}
          onUpdated={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

// import { useMemo, useState } from "react";
// import { useGetCategoriesQuery, useDeactivateCategoryMutation } from "../api";
// import type { CategoryListItem } from "../types";
// import AddCategoryModal from "./CategoryAddPage";
// import EditCategoryModal from "./CategoryEditPage";
// import "./CategoriesPage.css";

// export default function CategoriesPage() {
//   const [includeInactive, setIncludeInactive] = useState(false);
//   const [search, setSearch] = useState("");

//   const {
//     data: rows = [],
//     isFetching,
//     refetch,
//   } = useGetCategoriesQuery({ includeInactive });

//   const [deactivate, { isLoading: deactivating }] = useDeactivateCategoryMutation();

//   const [showAdd, setShowAdd] = useState(false);
//   const [editId, setEditId] = useState<number | null>(null);

//   const nameById = useMemo(() => {
//     const map = new Map<number, string>();
//     rows.forEach((r: CategoryListItem) => map.set(r.categoryId, r.name));
//     return map;
//   }, [rows]);

//   const filteredRows = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return rows;
//     return rows.filter((r) => {
//       const idText = `#${r.categoryId}`;
//       const name = r.name.toLowerCase();
//       const parent =
//         r.parentCategoryId ? (nameById.get(r.parentCategoryId) || `#${r.parentCategoryId}`) : "";
//       return (
//         idText.toLowerCase().includes(q) ||
//         name.includes(q) ||
//         parent.toString().toLowerCase().includes(q)
//       );
//     });
//   }, [rows, search, nameById]);

//   return (
//     <div className="category-page">
//       <div className="card">
//         <div className="category-header">
//           <h1 className="category-title">Category Management</h1>

//           <div className="category-toolbar">
//             {/* search */}
//             <div className="cat-search" role="search">
//               <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
//                 <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
//                 <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" />
//               </svg>
//               <input
//                 placeholder="Search categories…"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>

//             {/* show inactive toggle */}
//             <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
//               <input
//                 type="checkbox"
//                 checked={includeInactive}
//                 onChange={(e) => setIncludeInactive(e.target.checked)}
//               />
//               <span>Show inactive</span>
//             </label>

//             {/* actions */}
//             <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
//               + New Category
//             </button>
//             <button className="btn btn-ghost" onClick={() => refetch()} disabled={isFetching}>
//               {isFetching ? "Refreshing…" : "Refresh"}
//             </button>
//           </div>
//         </div>

//         <div className="category-table-wrapper">
//           <table className="category-table">
//             <thead>
//               <tr>
//                 <th className="col-id">ID</th>
//                 <th>Name</th>
//                 <th>Parent</th>
//                 <th className="text-center">Status</th>
//                 <th style={{ width: 200 }} className="text-center">
//                   Action
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredRows.map((d: CategoryListItem) => (
//                 <tr key={d.categoryId}>
//                   <td className="col-id">#{d.categoryId}</td>
//                   <td className="col-name">
//                     <div className="cell-ellipsis">{d.name}</div>
//                   </td>
//                   <td className="col-parent">
//                     <div className="cell-ellipsis">
//                       {d.parentCategoryId
//                         ? nameById.get(d.parentCategoryId) ?? `#${d.parentCategoryId}`
//                         : "—"}
//                     </div>
//                   </td>
//                   <td className="text-center">
//                     <span className={`badge ${d.isActive ? "badge--success" : "badge--muted"}`}>
//                       {d.isActive ? "Active" : "Inactive"}
//                     </span>
//                   </td>
//                   <td className="text-center">
//                     <div className="category-actions">
//                       <button className="btn btn-ghost" onClick={() => setEditId(d.categoryId)}>
//                         Edit
//                       </button>
//                       <button
//                         className="btn"
//                         style={{ background: "#ef4444", color: "#fff", borderColor: "#ef4444" }}
//                         disabled={!d.isActive || deactivating}
//                         onClick={async () => {
//                           if (
//                             !confirm("Deactivate this category? (Only allowed when no products)")
//                           )
//                             return;
//                           try {
//                             await deactivate(d.categoryId).unwrap();
//                             refetch();
//                           } catch (e: any) {
//                             alert(e?.data ?? "Failed to deactivate category");
//                           }
//                         }}
//                       >
//                         Deactivate
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}

//               {filteredRows.length === 0 && (
//                 <tr>
//                   <td colSpan={5}>
//                     <div className="empty">
//                       <h4>No categories</h4>
//                       <p>Try clearing the search or create a new category.</p>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {showAdd && (
//         <AddCategoryModal
//           open={showAdd}
//           onClose={() => setShowAdd(false)}
//           onCreated={() => {
//             refetch(); // wrap so callback returns void (fixes TS)
//           }}
//         />
//       )}

//       {editId !== null && (
//         <EditCategoryModal
//           id={editId}
//           open={true}
//           onClose={() => setEditId(null)}
//           onUpdated={() => {
//             refetch(); // wrap so callback returns void (fixes TS)
//           }}
//         />
//       )}
//     </div>
//   );
// }
