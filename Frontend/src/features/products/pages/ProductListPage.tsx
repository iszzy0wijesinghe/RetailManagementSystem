import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX } from "react-icons/fi";
import { useGetProductsQuery, useDeleteProductMutation } from "../api";
import AddProductModal from "../pages/AddProductModal";
import EditProductModal from "../pages/EditProductModal";
import '../styles/ProdcutList.css';


export default function ProductListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const activeParam = status === "all" ? undefined : status === "active" ? true : false;

  const { data, isLoading, isError, refetch } = useGetProductsQuery({ q, active: activeParam });
  const [del, { isLoading: isDeleting }] = useDeleteProductMutation();

  const rows = useMemo(() => data ?? [], [data]);

  async function handleDelete(id: number) {
    if (!confirm("Mark this product inactive?")) return;
    await del(id).unwrap();
    refetch();
  }

  return (
    // <div className="container-fluid py-3 product-list">
    <div className="rms-uber product-list">
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="fw-bold mb-0">Product Management</h2>
        <button className="btn-primary1-uber" onClick={() => setShowAdd(true)}>
          <FiPlus /> Add Product
        </button>

      </div>

      {/* Filters card */}
      <div className="card shadow-sm filters">
        <div className="card-body">
          <div className="rms-search">
            {/* Search bar */}
            <div className="rms-search__bar">
              <FiSearch className="rms-search__icon" />
              <input
                className="rms-search__input"
                placeholder="Search by SKU or Name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refetch()}
              />
              {q && (
                <button
                  className="rms-search__clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQ("")}
                >
                  <FiX />
                </button>
              )}
              <button
                className="rms-search__submit"
                type="button"
                onClick={() => refetch()}
              >
                <FiSearch /> <span className="hide-sm">Search</span>
              </button>
            </div>

            {/* Filter switch (All / Active / Inactive) */}
            <div className="rms-segment" role="tablist" aria-label="Status filter">
              {(["all", "active", "inactive"] as const).map(opt => (
                <button
                  key={opt}
                  role="tab"
                  type="button"
                  className={`rms-segment__btn ${status === opt ? "is-active" : ""}`}
                  aria-selected={status === opt}
                  onClick={() => setStatus(opt)}
                >
                  {opt === "all" ? "All" : opt === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Table card — only the table area scrolls */}
      <div className="card shadow-sm card--table">
        {isLoading && (
          <div className="loading-wrap d-flex justify-content-center">
            <div className="spinner-border" role="status" aria-label="loading" />
          </div>
        )}

        {isError && (
          <div className="card-body">
            <div className="alert alert-danger mb-0">Failed to load products.</div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="card-body">
            <div className="table-scroll">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50px" }}>ID</th>
                    <th style={{ width: "90px" }}>Category ID</th>
                    <th style={{ width: "120px" }}>Name</th>
                    <th className="text-end" style={{ width: "120px" }}>Unit Price (LKR)</th>
                    <th style={{ width: "90px" }}>Qty On Hand</th>
                    <th style={{ width: "90px" }}>Status</th>
                    <th className="action-col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p: any) => (
                    <tr key={p.productId}>
                      <td>{p.productId}</td>
                      <td>{p.categoryId ?? "—"}</td>
                      <td>
                        
                          {p.name}
                        
                      </td>
                      <td className="text-end">{Number(p.unitPrice).toFixed(2)}</td>
                      <td>{p.quantityOnHand}</td>
                      <td>
                        {p.isActive ? (
                          <span className="badge text-success-emphasis bg-success-subtle border border-success-subtle rounded-pill">
                            Active
                          </span>
                        ) : (
                          <span className="badge text-danger-emphasis bg-danger-subtle border border-danger-subtle rounded-pill">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="action-col">
                        <div className="btn-group btn-group-sm" role="group">


                          <button
                            className="btn-chip btn-chip--secondary"
                            title="Edit"
                            onClick={() => setEditId(p.productId)}
                          >
                            <FiEdit2 /> Edit
                          </button>

                          <button
                            className="btn-chip btn-chip--danger"
                            title="Mark Inactive"
                            onClick={() => handleDelete(p.productId)}
                            disabled={isDeleting}
                          >
                            <FiTrash2 /> Delete
                          </button>




                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal show={showAdd} onClose={() => setShowAdd(false)} onCreated={() => refetch()} />
      <EditProductModal show={editId !== null} productId={editId} onClose={() => setEditId(null)} onUpdated={() => refetch()} />
    </div>
  );
}


