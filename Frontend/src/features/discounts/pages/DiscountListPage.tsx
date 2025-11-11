// src/features/discounts/pages/DiscountsPage.tsx
import { useMemo, useState } from "react";
import {
    useGetDiscountsQuery,
    useSetDiscountActiveMutation,
} from "../api";
import type { DiscountListItem } from "../types";
import AddDiscountModal from "./AddDiscountModal";
import EditDiscountModal from "./EditDiscountModal";
import { FiEdit, FiPlus, FiToggleLeft, FiToggleRight, FiSearch } from "react-icons/fi";
import "./DiscountsPage.css";

export default function DiscountsPage() {
    const [q, setQ] = useState("");
    const [includeInactive, setIncludeInactive] = useState(false);
    const { data = [], isFetching, refetch } = useGetDiscountsQuery({ q, includeInactive });

    const [page, setPage] = useState(1);
    const pageSize = 10;
    const pages = Math.max(1, Math.ceil(data.length / pageSize));
    const rows = useMemo(() => data.slice((page - 1) * pageSize, page * pageSize), [data, page]);

    const [setActive] = useSetDiscountActiveMutation();

    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    return (
        <div className="disc-page">
            <div className="disc-head">
                <h2 className="fw-bold mb-0">Discount Management</h2>
                <div className="disc-actions">
                    <button className="btn-chip" onClick={() => refetch()} disabled={isFetching}>Refresh</button>
                    <button className="btn-chip btn-chip--secondary" onClick={() => setShowAdd(true)}>
                        <FiPlus /> New Discount
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-body disc-filters">
                    <div className="rms-search__bar" style={{ maxWidth: 420 }}>
                        <FiSearch className="rms-search__icon" />
                        <input
                            className="rms-search__input"
                            placeholder="Search by name"
                            value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                            onKeyDown={(e) => e.key === "Enter" && refetch()}
                        />
                        <button className="rms-search__submit" onClick={() => refetch()}>Search</button>
                    </div>

                    <label className="chip">
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={(e) => { setIncludeInactive(e.target.checked); setPage(1); }}
                        />
                        Include inactive
                    </label>

                    <div className="disc-total">{isFetching ? "Loading…" : `Total: ${data.length}`}</div>
                </div>
            </div>

            <div className="card card--table">
                <div className="card-body">
                    <div className="disc-table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 90, alignItems: "center" }}>#</th>
                                <th style={{ width: 200 }}>Name</th>
                                <th style={{ width: 100 }}>Type</th>
                                <th style={{ width: 90, textAlign: "center", verticalAlign: "middle" }}>Value</th>
                                <th style={{ width: 90 }}>Scope</th>
                                <th style={{ width: 90, textAlign: "center", verticalAlign: "middle" }}>Active</th>
                                <th style={{ width: 90 , textAlign: "center", verticalAlign: "middle"}}>Priority</th>
                                
                                <th style={{ width: 160 }} className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((d: DiscountListItem) => (
                                <tr key={d.discountId}>
                                    <td>#{d.discountId}</td>
                                    <td className="text-left" style={{ alignItems:"flex-start" }}>{d.name}</td>
                                    <td>{d.type}</td>
                                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>{d.value.toFixed(2)}</td>

                                    <td>{d.scope}</td>
                                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>{d.isActive ? "Yes" : "No"}</td>
                                    <td className="text-right" style={{ textAlign: "center", verticalAlign: "middle" }}>{d.priority}</td>
                                
                                    <td className="text-center">
                                        <button className="btn-chip" onClick={() => setEditId(d.discountId)}>
                                            <FiEdit /> Edit
                                        </button>
                                        <button
                                            className="btn-chip"
                                            onClick={async () => {
                                                try { await setActive({ id: d.discountId, value: !d.isActive }).unwrap(); }
                                                catch (e: any) { alert(e?.data ?? "Failed"); }
                                            }}
                                            title={d.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {d.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={9} className="text-center" style={{ padding: 22 }}>No discounts found.</td></tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>

            {pages > 1 && (
                <div className="card">
                    <div className="card-body disc-pager">
                        <button className="btn-chip" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                        <div className="disc-pageinfo">Page {page} / {pages}</div>
                        <button className="btn-chip" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
                    </div>
                </div>
            )}

            {showAdd && <AddDiscountModal open={showAdd} onClose={() => setShowAdd(false)} />}
            {editId !== null && (
                <EditDiscountModal
                    show={true}
                    id={editId}
                    onClose={() => setEditId(null)}
                    onUpdated={() => refetch()}
                />
            )}
        </div>
    );
}
