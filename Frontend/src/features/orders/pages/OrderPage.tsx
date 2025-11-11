
import { useEffect, useMemo, useState } from "react";
import {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useRemoveItemMutation,
  usePayOrderMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
  useVoidOrderMutation,
} from "../api";
import type { OrderDetailsDto, OrderItemDto } from "../types";
import { FiTrash2, FiRefreshCw, FiCreditCard, FiTag, FiSearch, FiEye } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import OrderDetailsModal from "./OrderViewModal";
import "./OrderModal.css";

export default function OrderPage() {
  const [params, setParams] = useSearchParams();
  const orderIdParam = Number(params.get("id") ?? 0);
  const [viewId, setViewId] = useState<number | null>(null);

  // ---------- Filters for LIST mode ----------
  const [qList, setQList] = useState("");
  const [status, setStatus] = useState<string>(""); // "", "Unpaid", "Paid", "Voided"
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // List query (shows when no id selected)
  const { data: listData, isFetching: fetchingList, refetch: refetchList } =
    useGetOrdersQuery({ q: qList, status, page, pageSize });

  const rows = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  // ---------- Single order (DETAIL mode) ----------
  const [triggerGet] = useLazyGetOrderByIdQuery();
  const { data: order, refetch, isFetching } = useGetOrderByIdQuery(orderIdParam, { skip: !orderIdParam });

  const [showAdd, setShowAdd] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState("");
  const [removeItem] = useRemoveItemMutation();
  const [payOrder, { isLoading: paying }] = usePayOrderMutation();
  const [applyCoupon, { isLoading: applying }] = useApplyCouponMutation();
  const [removeCouponMut, { isLoading: removingCoupon }] = useRemoveCouponMutation();
  const [voidOrder, { isLoading: voiding }] = useVoidOrderMutation();

  // 🔎 local order ID search (DETAIL)
  const [searchId, setSearchId] = useState(orderIdParam ? String(orderIdParam) : "");

  const totals = useMemo(() => {
    if (!order) return { sub: 0, disc: 0, tax: 0, grand: 0 };
    return {
      sub: order.subtotal,
      disc: order.discountTotal,
      tax: order.taxTotal,
      grand: order.grandTotal,
    };
  }, [order]);




  useEffect(() => {
    if (orderIdParam) triggerGet(orderIdParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdParam]);

  const isUnpaid = order?.status?.toLowerCase() === "unpaid";

  async function doSearchById() {
    const id = Number(searchId);
    if (!id || Number.isNaN(id)) {
      alert("Enter a valid Order ID number");
      return;
    }
    params.set("id", String(id));
    setParams(params, { replace: true });
    triggerGet(id);
  }

  function goView(id: number) {
    setSearchId(String(id));
    params.set("id", String(id));
    setParams(params, { replace: true });
  }



  return (
    <div className="orders-page rms-uber product-list">
      <div className="page-head">
        <h2 className="page-title">Order Management</h2>
        {order ?
          (
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button className="btn-primary-uber" onClick={() => refetch()} disabled={!order || isFetching}>
                <FiRefreshCw /> Refresh
              </button>
            </div>
          ) :
          (
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button className="btn-primary-uber" onClick={() => refetchList()} disabled={fetchingList}>
                <FiRefreshCw /> Refresh
              </button>
            </div>
          )}
      </div>

      {/* ---------- Top search by Order ID (DETAIL mode only) ---------- */}
      {order && (
        <div
          className="card filters filters--compact"
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
          }}
        >
          <div className="card-body" style={{ padding: "8px 10px" }}>
            <div
              className="rms-search"
              style={{ justifyContent: "space-between", gap: 12, alignItems: "center" }}
            >
              <div
                className="rms-search__bar"
                style={{
                  maxWidth: 460,
                  flex: "1 1 auto",
                  position: "relative",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  background: "#fff",
                  padding: "6px 6px 6px 40px", // compact vertical padding
                  minHeight: 40,
                }}
              >
                <FiSearch
                  className="rms-search__icon"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.7,
                  }}
                />
                <input
                  className="rms-search__input"
                  placeholder="Enter Order ID (e.g., 1024)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearchById()}
                  style={{
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    width: "100%",
                    height: 28,
                    font: "inherit",
                  }}
                />
                <button
                  className="rms-search__submit"
                  type="button"
                  onClick={doSearchById}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FiSearch /> <span className="hide-sm">Load</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div
                  className="chip"
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  Order: <strong>{order?.orderNumber}</strong>
                </div>
                <div
                  className="chip"
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  Status: <strong>{order?.status}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}




      {/* ================================================================
          LIST MODE (no id selected): show recent orders table
         ================================================================ */}
      {!order && (
        <>
          <div className="card">
            <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="rms-search__bar" style={{ maxWidth: 420 }}>
                <FiSearch className="rms-search__icon" />
                <input
                  className="rms-search__input"
                  placeholder="Search by Order # or ID"
                  value={qList}
                  onChange={(e) => setQList(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (setPage(1), refetchList())}
                />
                <button className="rms-search__submit" onClick={() => { setPage(1); refetchList(); }}>
                  Search
                </button>
              </div>

              <select
                className="form-select"
                style={{ maxWidth: 220, borderRadius: 12 }}
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <option value="">All statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Voided">Voided</option>
              </select>

              <div style={{ marginLeft: "auto", fontWeight: 700 }}>
                {fetchingList ? "Loading…" : `Total: ${total}`}
              </div>
            </div>
          </div>

          <div className="card card--table">
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Order ID</th>
                    <th>Order #</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 120 }} className="text-right">Items</th>
                    <th style={{ width: 140 }} className="text-right">Grand</th>
                    <th style={{ width: 220 }}>Created</th>
                    <th style={{ width: 120 }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(o => (
                    <tr key={o.orderId}>
                      <td>#{o.orderId}</td>
                      <td className="text-right">{o.orderNumber}</td>
                      <td>
                        <span className={`chip ${o.status === "Paid" ? "chip--ok" : o.status === "Unpaid" ? "" : "chip--warn"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-right">{o.itemsCount}</td>
                      <td className="text-right">{o.grandTotal.toFixed(2)}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="text-center">
                        <button className="btn-chip btn-chip--secondary" onClick={() => setViewId(o.orderId)}>
                          View
                        </button>

                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="text-center" style={{ padding: 22 }}>No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="card-pagination">
              <div className="card-body - pagination" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn-chip" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <div style={{ padding: "8px 12px" }}>Page {page} / {pages}</div>
                <button className="btn-chip" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================
          DETAIL MODE (id selected): your existing order detail view
         ================================================================ */}
      {order && (
        <>
          <div className="card">
            <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                ID: <strong>{order.orderId}</strong> • Created: {new Date(order.createdAt).toLocaleString()}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="chip chip--ok">Subtotal: {totals.sub.toFixed(2)}</div>
                <div className="chip">Discount: {totals.disc.toFixed(2)}</div>
                <div className="chip">Tax: {totals.tax.toFixed(2)}</div>
                <div className="chip chip--ok">Grand: {totals.grand.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Coupon area */}
                <div className="rms-search__bar" style={{ maxWidth: 320 }}>
                  <FiTag />
                  <input
                    className="rms-search__input"
                    placeholder="Apply coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && coupon.trim() && isUnpaid) {
                        try {
                          await applyCoupon({
                            id: order.orderId,
                            body: { code: coupon.trim(), customerId: order.customerId ?? undefined },
                          }).unwrap();
                          setCoupon("");
                          refetch();
                        } catch (err: any) {
                          alert(err?.data ?? "Failed to apply coupon");
                        }
                      }
                    }}
                  />
                  <button
                    className="rms-search__submit"
                    disabled={!coupon.trim() || !isUnpaid || applying}
                    onClick={async () => {
                      try {
                        await applyCoupon({
                          id: order.orderId,
                          body: { code: coupon.trim(), customerId: order.customerId ?? undefined },
                        }).unwrap();
                        setCoupon("");
                        refetch();
                      } catch (err: any) {
                        alert(err?.data ?? "Failed to apply coupon");
                      }
                    }}
                  >
                    Apply
                  </button>
                </div>

                <button
                  className="btn-chip"
                  disabled={!isUnpaid || removingCoupon}
                  onClick={async () => {
                    try {
                      await removeCouponMut({ id: order.orderId }).unwrap();
                      refetch();
                    } catch (err: any) {
                      alert(err?.data ?? "Failed to remove coupon");
                    }
                  }}
                >
                  Remove Coupon
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-chip btn-chip--secondary"
                  disabled={!isUnpaid || paying || order.items.length === 0}
                  onClick={async () => {
                    try {
                      await payOrder({ id: order.orderId, body: { changedByUserId: 0 } }).unwrap();
                      refetch();
                    } catch (err: any) {
                      alert(err?.data ?? "Failed to pay order");
                    }
                  }}
                >
                  <FiCreditCard /> Pay
                </button>

                <button
                  className="btn-chip btn-chip--danger"
                  disabled={!isUnpaid || voiding}
                  onClick={async () => {
                    try {
                      await voidOrder({ id: order.orderId }).unwrap();
                      refetch();
                    } catch (err: any) {
                      alert(err?.data ?? "Failed to void order");
                    }
                  }}
                >
                  Void
                </button>
              </div>
            </div>
          </div>

          <div className="card card--table">
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Item ID</th>
                    <th style={{ width: 120 }}>Product ID</th>
                    <th>Name</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((line: OrderItemDto) => (
                    <tr key={line.orderItemId}>
                      <td>{line.orderItemId}</td>
                      <td>{line.productId}</td>
                      <td className="truncate">{line.productNameSnapshot}</td>
                      <td className="text-right">{line.unitPrice.toFixed(2)}</td>
                      <td className="text-right">{line.quantity}</td>
                      <td className="text-right">{line.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center" style={{ padding: "22px" }}>
                        No items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      {viewId !== null && (
        <OrderDetailsModal
          orderId={viewId}
          onClose={() => setViewId(null)}   // ← Back button closes this
          onChanged={() => {                // pay/void completed
            setViewId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}