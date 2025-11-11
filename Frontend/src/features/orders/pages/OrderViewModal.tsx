// src/features/orders/components/OrderDetailsModal.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCreditCard, FiTrash2 } from "react-icons/fi";
import {
  useGetOrderByIdQuery,
  usePayOrderMutation,
  useVoidOrderMutation,
  useRemoveItemMutation,
} from "../api";
import type { OrderItemDto } from "../types";
import "./OrderViewModal.css";

type Props = {
  orderId: number;
  onClose: () => void;     // Back / Close button
  onChanged?: () => void;  // fire after pay/void
};

export default function OrderDetailsModal({ orderId, onClose, onChanged }: Props) {
  const { data: order, refetch, isFetching } = useGetOrderByIdQuery(orderId);
  const [payOrder, { isLoading: paying }] = usePayOrderMutation();
  const [voidOrder, { isLoading: voiding }] = useVoidOrderMutation();
  const [removeItem, { isLoading: removing }] = useRemoveItemMutation();

  const isUnpaid = (order?.status ?? "").toLowerCase() === "unpaid";

  // Lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handlePay() {
    if (!order || !isUnpaid || order.items.length === 0) return;
    try {
      await payOrder({ id: order.orderId, body: { changedByUserId: 0 } }).unwrap();
      onChanged?.();
    } catch (e: any) {
      alert(e?.data ?? "Failed to pay order");
    }
  }

  async function handleVoid() {
    if (!order || !isUnpaid) return;
    try {
      await voidOrder({ id: order.orderId }).unwrap();
      onChanged?.();
    } catch (e: any) {
      alert(e?.data ?? "Failed to void order");
    }
  }

  return createPortal(
    <div className="rms-modal__overlay" onClick={onClose}>
      <div
        className="rms-modal rms-modal--slide rms-modal--sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="rms-modal__header"
          style={{
            background: "transparent",
            padding: "10px 14px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            border: 0,
          }}
        >

          <div className="rms-title" style={{ fontWeight: 800, fontSize: 14, flex: "1 1 auto", textAlign: "center", minWidth: 180 }}>
            {order ? <>Order <strong>#{order.orderId}</strong> • {order.orderNumber}</> : "Loading…"}
          </div>
        </div>


        <div className="rms-modal__body">
          {isFetching && <div className="rms-loading">Loading…</div>}

          {order && (
            <>
              <div
                className="rms-order-meta"
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}
              >
                <span
                  className={`chip ${order.status === "Paid" ? "chip--ok" : order.status === "Unpaid" ? "" : "chip--warn"}`}
                  style={{ justifyContent: "center", textAlign: "center", width: "6rem" }}
                >
                  {order.status}
                </span>

                <span className="chip" style={{ justifyContent: "center", textAlign: "center", marginLeft: "-5rem" }}>
                  Created: {new Date(order.createdAt).toLocaleString()}
                </span>

                <span className="chip" style={{ justifyContent: "center", textAlign: "center" }}>
                  Grand: <strong>{order.grandTotal.toFixed(2)}</strong>
                </span>
              </div>



              <div className="rms-table-wrap">
                <table className="rms-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Item ID</th>
                      <th style={{ width: 120 }}>Product ID</th>
                      <th>Name</th>
                      <th className="is-right" style={{ width: 80 }}>Unit</th>
                      <th className="is-right" style={{ width: 80 }}>Qty</th>
                      <th className="is-right" style={{ width: 120 }}>Line Total</th>
                      {isUnpaid && <th className="is-center" style={{ width: 150 }}>Act</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((line: OrderItemDto) => (
                      <tr key={line.orderItemId}>
                        <td>{line.orderItemId}</td>
                        <td>{line.productId}</td>

                        <td>
                          <div
                            className="cell-scroll"
                            title={line.productNameSnapshot ?? line.productName ?? ""}
                          >
                            {line.productNameSnapshot ?? line.productName ?? "—"}
                          </div>
                        </td>

                        <td className="is-right">{line.unitPrice.toFixed(2)}</td>
                        <td className="is-right">{line.quantity}</td>
                        <td className="is-right">{line.lineTotal.toFixed(2)}</td>
                        {isUnpaid && (
                          <td className="is-center">
                            <button
                              className="btn-chip btn-chip--danger"
                              disabled={removing}
                              onClick={async () => {
                                try {
                                  await removeItem({ id: order.orderId, itemId: line.orderItemId }).unwrap();
                                  refetch();
                                } catch (err: any) {
                                  alert(err?.data ?? "Failed to remove item");
                                }
                              }}
                            >
                              <FiTrash2 /> Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {order.items.length === 0 && (
                      <tr>
                        <td colSpan={isUnpaid ? 7 : 6} className="is-center" style={{ padding: 22 }}>
                          No items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>


        <div
          className="rms-modal__footer"
          style={{
            background: "transparent",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            border: 0, // if any border leaks in
          }}
        >
          <button className="btn-chip" onClick={onClose}>Close</button>

          {isUnpaid && (
            <div className="rms-footer-right" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className="btn-chip btn-chip--secondary"
                disabled={(order?.items.length ?? 0) === 0 || paying}
                onClick={handlePay}
              >
                <FiCreditCard /> Pay
              </button>
            </div>
          )}
        </div>



      </div>
    </div>,
    document.body
  );
}
















// // src/features/orders/components/OrderDetailsModal.tsx
// import { useEffect } from "react";
// import { createPortal } from "react-dom";
// import { FiX, FiCreditCard, FiTrash2 } from "react-icons/fi";
// import {
//     useGetOrderByIdQuery,
//     usePayOrderMutation,
//     useVoidOrderMutation,
//     useRemoveItemMutation,
// } from "../api";
// import type { OrderItemDto } from "../types";
// import "./OrderModal.css";

// type Props = {
//     orderId: number;
//     onClose: () => void;     // Back / Close button
//     onChanged?: () => void;  // fire after pay/void
// };

// export default function OrderDetailsModal({ orderId, onClose, onChanged }: Props) {
//     const { data: order, refetch, isFetching } = useGetOrderByIdQuery(orderId);
//     const [payOrder, { isLoading: paying }] = usePayOrderMutation();
//     const [voidOrder, { isLoading: voiding }] = useVoidOrderMutation();
//     const [removeItem, { isLoading: removing }] = useRemoveItemMutation();

//     const isUnpaid = (order?.status ?? "").toLowerCase() === "unpaid";

//     // Lock background scroll while modal is open
//     useEffect(() => {
//         const prev = document.body.style.overflow;
//         document.body.style.overflow = "hidden";
//         return () => { document.body.style.overflow = prev; };
//     }, []);

//     async function handlePay() {
//         if (!order || !isUnpaid || order.items.length === 0) return;
//         try {
//             await payOrder({ id: order.orderId, body: { changedByUserId: 0 } }).unwrap();
//             onChanged?.();
//         } catch (e: any) {
//             alert(e?.data ?? "Failed to pay order");
//         }
//     }

//     async function handleVoid() {
//         if (!order || !isUnpaid) return;
//         try {
//             await voidOrder({ id: order.orderId }).unwrap();
//             onChanged?.();
//         } catch (e: any) {
//             alert(e?.data ?? "Failed to void order");
//         }
//     }

//     // 👇 Portal to <body> so it’s a real popup, not a routed page
//     return createPortal(
//         <div className="rms-modal__overlay" onClick={onClose}>
//             <div
//                 className="rms-modal rms-modal--slide rms-modal--sm"
//                 onClick={(e) => e.stopPropagation()}
//                 role="dialog"
//                 aria-modal="true"
//             >

//                 <div className="rms-modal__header">
//                     <button className="rms-back" onClick={onClose}>Back</button>
//                     <div className="rms-title">
//                         {order ? <>Order <strong>#{order.orderId}</strong> • {order.orderNumber}</> : "Loading…"}
//                     </div>
//                     <button className="rms-close" onClick={onClose} aria-label="Close">
//                         <FiX />
//                     </button>
//                 </div>

//                 <div className="rms-modal__body">
//                     {isFetching && <div className="rms-loading">Loading…</div>}

//                     {order && (
//                         <>
//                             <div className="rms-order-meta">
//                                 <span className={`chip ${order.status === "Paid" ? "chip--ok" : order.status === "Unpaid" ? "" : "chip--warn"}`}>
//                                     {order.status}
//                                 </span>
//                                 <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
//                                 <span>Grand: <strong>{order.grandTotal.toFixed(2)}</strong></span>
//                             </div>

//                             <div className="rms-table-wrap">
//                                 <table className="table">
//                                     <thead>
//                                         <tr>
//                                             <th style={{ width: 120 }}>Item ID</th>
//                                             <th style={{ width: 120 }}>Product ID</th>
//                                             <th>Name</th>
//                                             <th className="text-right">Unit</th>
//                                             <th className="text-right">Qty</th>
//                                             <th className="text-right">Line Total</th>
//                                             {isUnpaid && <th className="text-center" style={{ width: 120 }}>Act</th>}
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {order.items.map((line: OrderItemDto) => (
//                                             <tr key={line.orderItemId}>
//                                                 <td>{line.orderItemId}</td>
//                                                 <td>{line.productId}</td>
//                                                 <td className="truncate">{line.productNameSnapshot}</td>
//                                                 <td className="text-right">{line.unitPrice.toFixed(2)}</td>
//                                                 <td className="text-right">{line.quantity}</td>
//                                                 <td className="text-right">{line.lineTotal.toFixed(2)}</td>
//                                                 {isUnpaid && (
//                                                     <td className="text-center">
//                                                         <button
//                                                             className="btn-chip btn-chip--danger"
//                                                             disabled={removing}
//                                                             onClick={async () => {
//                                                                 try {
//                                                                     await removeItem({ id: order.orderId, itemId: line.orderItemId }).unwrap();
//                                                                     refetch();
//                                                                 } catch (err: any) {
//                                                                     alert(err?.data ?? "Failed to remove item");
//                                                                 }
//                                                             }}
//                                                         >
//                                                             <FiTrash2 /> Remove
//                                                         </button>
//                                                     </td>
//                                                 )}
//                                             </tr>
//                                         ))}
//                                         {order.items.length === 0 && (
//                                             <tr><td colSpan={isUnpaid ? 7 : 6} className="text-center" style={{ padding: 22 }}>No items.</td></tr>
//                                         )}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </>
//                     )}
//                 </div>

//                 <div className="rms-modal__footer">
//                     <button className="btn-chip" onClick={onClose}>Close</button>
//                     <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
//                         <button
//                             className="btn-chip btn-chip--secondary"
//                             disabled={!isUnpaid || (order?.items.length ?? 0) === 0 || paying}
//                             onClick={handlePay}
//                         >
//                             <FiCreditCard /> Pay
//                         </button>
//                         <button
//                             className="btn-chip btn-chip--danger"
//                             disabled={!isUnpaid || voiding}
//                             onClick={handleVoid}
//                         >
//                             Void
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>,
//         document.body
//     );
// }
