 // src/features/pos/pages/PosPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useAddItemMutation,
  useUpdateItemMutation,
  useRemoveItemMutation,
  usePayOrderMutation,
  useVoidOrderMutation,
  useLazySearchProductsQuery,
} from "../api";
import type { OrderItemDto, ProductLite } from "../types";
import {
  FiPlus, FiMinus, FiTrash2, FiCreditCard, FiX, FiSearch, FiRefreshCw,
} from "react-icons/fi";
import "./pos.css";

const DRAFT_KEY = "pos.draftOrderId";

export default function PosPage() {
  const [params, setParams] = useSearchParams();
  const idParam = Number(params.get("id") ?? 0);

  const [createOrder] = useCreateOrderMutation();
  const [triggerGet] = useLazyGetOrderByIdQuery();
  const { data: order, refetch, isFetching } = useGetOrderByIdQuery(idParam, { skip: !idParam });

  const [addItem, { isLoading: adding }] = useAddItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateItemMutation();
  const [removeItem, { isLoading: removing }] = useRemoveItemMutation();
  const [payOrder, { isLoading: paying }] = usePayOrderMutation();
  const [voidOrder, { isLoading: voiding }] = useVoidOrderMutation();

  // LEFT: product add / scan
  const [barcode, setBarcode] = useState("");
  const [qty, setQty] = useState(1);

  // RIGHT: payment keypad
  const [amountStr, setAmountStr] = useState("0");

  // search/autocomplete state
  const [query, setQuery] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [triggerSearch, { data: suggestions = [], isFetching: searching }] =
    useLazySearchProductsQuery();

  // --- NEW: bootstrap guard + resume prompt state
  const bootstrappedRef = useRef(false);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      if (q.length >= 2) {
        triggerSearch({ q, take: 15 });
        setOpenSug(true);
      } else {
        setOpenSug(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query, triggerSearch]);

  async function addByProductId(pid: number) {
    if (!order || !isUnpaid || qty <= 0) return;
    try {
      const existing = order.items.find(l => l.productId === pid);
      if (existing) {
        await updateItem({
          id: order.orderId,
          itemId: existing.orderItemId,
          body: { productId: pid, quantity: existing.quantity + qty },
        }).unwrap();
      } else {
        await addItem({
          id: order.orderId,
          body: { productId: pid, quantity: qty },
        }).unwrap();
      }
      setQuery(""); setQty(1); setOpenSug(false);
      refetch();
    } catch (e: any) {
      alert(e?.data ?? "Failed to add item");
    }
  }

  // --- NEW: helpers for draft id in localStorage
  function saveDraftId(id: number) {
    try { localStorage.setItem(DRAFT_KEY, String(id)); } catch {}
  }
  function getDraftId(): number | null {
    try {
      const v = localStorage.getItem(DRAFT_KEY);
      const num = v ? Number(v) : 0;
      return num > 0 ? num : null;
    } catch { return null; }
  }

  // --- UPDATED: create/restore logic on first mount
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    (async () => {
      // If URL already has an id, respect it and remember as draft
      if (idParam) {
        saveDraftId(idParam);
        return;
      }

      // Try resuming the cached draft
      const cached = getDraftId();
      if (cached) {
        const res = await triggerGet(cached, true); // fetch if needed
        const data = res?.data as any;
        if (data && String(data.status).toLowerCase() === "unpaid") {
          const empty = (data.items?.length ?? 0) === 0;
          if (empty) {
            // show prompt to resume or start new
            setResumeId(cached);
            setShowResumePrompt(true);
            return; // hold until user decides
          }
        }
      }

      // Otherwise, create a fresh order once
      const newId = await createOrder({ customerId: null }).unwrap();
      saveDraftId(newId);
      params.set("id", String(newId));
      setParams(params, { replace: true });
      triggerGet(newId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // clock in header (unchanged)
  useEffect(() => {
    const el = document.getElementById("posClock");
    const tick = () => el && (el.textContent = new Date().toLocaleString());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const isUnpaid = order?.status?.toLowerCase() === "unpaid";

  const totals = useMemo(() => {
    if (!order) return { sub: 0, disc: 0, tax: 0, grand: 0 };
    return {
      sub: order.subtotal,
      disc: order.discountTotal,
      tax: order.taxTotal,
      grand: order.grandTotal,
    };
  }, [order]);

  const amountTendered = Number(amountStr || "0");
  const change = Math.max(0, amountTendered - (totals.grand || 0));

  async function inc(line: OrderItemDto) {
    if (!order || !isUnpaid) return;
    await updateItem({
      id: order.orderId,
      itemId: line.orderItemId,
      body: { productId: line.productId, quantity: line.quantity + 1 },
    }).unwrap();
    refetch();
  }
  async function dec(line: OrderItemDto) {
    if (!order || !isUnpaid) return;
    const next = Math.max(1, line.quantity - 1);
    await updateItem({
      id: order.orderId,
      itemId: line.orderItemId,
      body: { productId: line.productId, quantity: next },
    }).unwrap();
    refetch();
  }
  async function removeLine(line: OrderItemDto) {
    if (!order || !isUnpaid) return;
    await removeItem({ id: order.orderId, itemId: line.orderItemId }).unwrap();
    refetch();
  }

  function pressKey(k: string) {
    setAmountStr(s => {
      if (k === "CLR") return "0";
      if (k === "DEL") return s.length <= 1 ? "0" : s.slice(0, -1);
      if (k === "." && s.includes(".")) return s; // one dot
      if (s === "0" && k !== ".") return k;
      return s + k;
    });
  }

  function quickTender(v: number) {
    setAmountStr(String(Number(amountStr || "0") + v));
  }

  // --- NEW: actions from the resume prompt
  async function resumeDraft() {
    if (!resumeId) return;
    params.set("id", String(resumeId));
    setParams(params, { replace: true });
    saveDraftId(resumeId);
    triggerGet(resumeId);
    setShowResumePrompt(false);
  }

  async function startNewOrder() {
    const newId = await createOrder({ customerId: null }).unwrap();
    saveDraftId(newId);
    params.set("id", String(newId));
    setParams(params, { replace: true });
    triggerGet(newId);
    setShowResumePrompt(false);
  }

  return (
    <>
      {/* ===== Resume Draft Prompt (very small modal) ===== */}
      {showResumePrompt && (
        <div className="rms-modal__overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999 }}>
          <div
            className="card"
            style={{
              width: 420, maxWidth: "92vw",
              margin: "12vh auto 0", background: "#fff",
              borderRadius: 16, border: "1px solid #e5e7eb",
              boxShadow: "0 20px 60px rgba(0,0,0,.18)", padding: 16
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Resume empty draft?</div>
            <div style={{ color: "#475569", marginBottom: 14 }}>
              Your last order <b>#{resumeId}</b> is Unpaid and has no items. Continue it or create a new order?
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-chip" onClick={resumeDraft}>Continue #{resumeId}</button>
              <button className="btn-chip btn-chip--secondary" onClick={startNewOrder}>New Order</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Existing POS UI ===== */}
      <div className="pos-grid">
        {/* LEFT: Cart pane */}
        <section className="pos-left">
          <div className="pos-left__head">
            <div className="pos-scan" style={{ position: "relative" }}>
              <input
                autoFocus
                className="pos-scan__input"
                placeholder="Search by name (or type Product ID)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const k = query.trim();
                    const asNum = Number(k);
                    if (!Number.isNaN(asNum) && k !== "" && /^\d+$/.test(k)) {
                      addByProductId(asNum);
                      return;
                    }
                    if (suggestions.length > 0) addByProductId(suggestions[0].productId);
                  }
                }}
              />

              {openSug && (
                <div className="pos-suggest">
                  {searching && <div className="pos-suggest__item">Searching…</div>}
                  {!searching && suggestions.length === 0 && (
                    <div className="pos-suggest__item">No matches</div>
                  )}
                  {suggestions.map((s: ProductLite) => (
                    <button
                      key={s.productId}
                      className="pos-suggest__item"
                      onClick={() => addByProductId(s.productId)}
                    >
                      <div className="pos-suggest__name">{s.name}</div>
                      <div className="pos-suggest__meta">
                        #{s.productId} • LKR {s.unitPrice.toFixed(2)} • QOH {s.qtyOnHand}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pos-qty">
              <button className="pos-qty__btn" onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
              <input
                className="pos-qty__val"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button className="pos-qty__btn" onClick={() => setQty(q => q + 1)}><FiPlus /></button>
            </div>
            <button className="pos-refresh" onClick={() => refetch()} disabled={!order || isFetching}>
              <FiRefreshCw />
            </button>
          </div>

          <div className="pos-cart card">
            <header className="pos-cart__head">
              <div>
                <div className="pos-order-no">{order?.orderNumber ?? "Creating…"}</div>
                <div className="pos-subtext">Status: {order?.status ?? "-"}</div>
              </div>
              {order && (
                <button
                  className="pos-void"
                  disabled={!isUnpaid || voiding}
                  onClick={async () => {
                    try { await voidOrder({ id: order.orderId }).unwrap(); refetch(); }
                    catch (e: any) { alert(e?.data ?? "Failed to void order"); }
                  }}
                >
                  <FiX /> Void
                </button>
              )}
            </header>

            <div className="pos-cart__body">
              {!order || order.items.length === 0 ? (
                <div className="pos-empty">No items yet — scan a product to begin.</div>
              ) : (
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="t-right">Unit</th>
                      <th className="t-center">Qty</th>
                      <th className="t-right">Total</th>
                      <th className="t-center">Act</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(line => (
                      <tr key={line.orderItemId}>
                        <td>
                          <div className="pos-name">{line.productNameSnapshot}</div>
                          <div className="pos-subtext">#{line.productId}</div>
                        </td>
                        <td className="t-right">{line.unitPrice.toFixed(2)}</td>
                        <td className="t-center">
                          <div className="qty-inline">
                            <button className="qty-inline__btn" disabled={!isUnpaid || updating} onClick={() => dec(line)}><FiMinus /></button>
                            <span className="qty-inline__val">{line.quantity}</span>
                            <button className="qty-inline__btn" disabled={!isUnpaid || updating} onClick={() => inc(line)}><FiPlus /></button>
                          </div>
                        </td>
                        <td className="t-right">{line.lineTotal.toFixed(2)}</td>
                        <td className="t-center">
                          <button className="btn-chip btn-chip--danger" disabled={!isUnpaid || removing} onClick={() => removeLine(line)}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <footer className="pos-cart__foot">
              <div className="row">
                <span>Subtotal</span><span>{totals.sub.toFixed(2)}</span>
              </div>
              <div className="row">
                <span>Discount</span><span>{totals.disc.toFixed(2)}</span>
              </div>
              <div className="row">
                <span>Tax</span><span>{totals.tax.toFixed(2)}</span>
              </div>
              <div className="row grand">
                <span>Grand Total</span><span>{totals.grand.toFixed(2)}</span>
              </div>
            </footer>
          </div>
        </section>

        {/* RIGHT: Keypad & tender */}
        <section className="pos-right">
          <div className="pay-box card">
            <div className="pay-line">
              <label>Balance Due</label>
              <div className="pay-val due">{totals.grand.toFixed(2)}</div>
            </div>
            <div className="pay-line">
              <label>Amount Tendered</label>
              <input
                className="pay-input"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div className="pay-line">
              <label>Change</label>
              <div className="pay-val">{change.toFixed(2)}</div>
            </div>

            <div className="keypad">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."].map(k => (
                <button key={k} className={`key ${k === "C" ? "key--muted" : ""}`} onClick={() => pressKey(k === "C" ? "CLR" : k)}>
                  {k === "C" ? "CLR" : k}
                </button>
              ))}
              <button className="key key--muted" onClick={() => pressKey("DEL")}>DEL</button>
            </div>

            <div className="tenders">
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} className="tender" onClick={() => quickTender(v)}>
                  + {v.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="pay-actions">
              <button
                className="btn-chip btn-chip--secondary btn-pay"
                disabled={!order || !isUnpaid || paying || order.items.length === 0}
                onClick={async () => {
                  try {
                    await payOrder({ id: order!.orderId, body: { changedByUserId: 0 } }).unwrap();

                    // ✅ immediately start the next order ONCE
                    const newId = await createOrder({ customerId: null }).unwrap();
                    saveDraftId(newId);
                    params.set("id", String(newId));
                    setParams(params, { replace: true });

                    setAmountStr("0");
                    setBarcode?.("");
                    setQty?.(1);

                    triggerGet(newId);
                  } catch (e: any) {
                    alert(e?.data ?? "Failed to pay order");
                  }
                }}
              >
                <FiCreditCard /> Pay
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
















// // src/features/pos/pages/PosPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import {
//   useCreateOrderMutation,
//   useGetOrderByIdQuery,
//   useLazyGetOrderByIdQuery,
//   useAddItemMutation,
//   useUpdateItemMutation,
//   useRemoveItemMutation,
//   usePayOrderMutation,
//   useVoidOrderMutation,
//   useLazySearchProductsQuery,
// } from "../api";
// import type { OrderItemDto, ProductLite } from "../types";
// import {
//   FiPlus, FiMinus, FiTrash2, FiCreditCard, FiX, FiSearch, FiRefreshCw,
// } from "react-icons/fi";
// import "./pos.css";


// export default function PosPage() {
//   const [params, setParams] = useSearchParams();
//   const idParam = Number(params.get("id") ?? 0);

//   const [createOrder] = useCreateOrderMutation();
//   const [triggerGet] = useLazyGetOrderByIdQuery();
//   const { data: order, refetch, isFetching } = useGetOrderByIdQuery(idParam, { skip: !idParam });

//   const [addItem, { isLoading: adding }] = useAddItemMutation();
//   const [updateItem, { isLoading: updating }] = useUpdateItemMutation();
//   const [removeItem, { isLoading: removing }] = useRemoveItemMutation();
//   const [payOrder, { isLoading: paying }] = usePayOrderMutation();
//   const [voidOrder, { isLoading: voiding }] = useVoidOrderMutation();

//   // LEFT: product add / scan
//   const [barcode, setBarcode] = useState("");
//   const [qty, setQty] = useState(1);

//   // RIGHT: payment keypad
//   const [amountStr, setAmountStr] = useState("0");

//   // search/autocomplete state
//   const [query, setQuery] = useState("");
//   const [openSug, setOpenSug] = useState(false);

//   // RTK Query: lazy search
//   const [triggerSearch, { data: suggestions = [], isFetching: searching }] =
//     useLazySearchProductsQuery();

//   useEffect(() => {
//     const t = setTimeout(() => {
//       const q = query.trim();
//       if (q.length >= 2) {
//         triggerSearch({ q, take: 15 });
//         setOpenSug(true);
//       } else {
//         setOpenSug(false);
//       }
//     }, 220);
//     return () => clearTimeout(t);
//   }, [query, triggerSearch]);


//   async function addByProductId(pid: number) {
//     if (!order || !isUnpaid || qty <= 0) return;
//     try {
//       const existing = order.items.find(l => l.productId === pid);
//       if (existing) {
//         await updateItem({
//           id: order.orderId,
//           itemId: existing.orderItemId,
//           body: { productId: pid, quantity: existing.quantity + qty },
//         }).unwrap();
//       } else {
//         await addItem({
//           id: order.orderId,
//           body: { productId: pid, quantity: qty },
//         }).unwrap();
//       }
//       setQuery(""); setQty(1); setOpenSug(false);
//       refetch();
//     } catch (e: any) {
//       alert(e?.data ?? "Failed to add item");
//     }
//   }



//   // create order on first load if needed
//   useEffect(() => {
//     (async () => {
//       if (!idParam) {
//         const newId = await createOrder({ customerId: null }).unwrap();
//         params.set("id", String(newId));
//         setParams(params, { replace: true });
//         triggerGet(newId);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // clock in header
//   useEffect(() => {
//     const el = document.getElementById("posClock");
//     const tick = () => el && (el.textContent = new Date().toLocaleString());
//     tick();
//     const t = setInterval(tick, 1000);
//     return () => clearInterval(t);
//   }, []);

//   const isUnpaid = order?.status?.toLowerCase() === "unpaid";

//   const totals = useMemo(() => {
//     if (!order) return { sub: 0, disc: 0, tax: 0, grand: 0 };
//     return {
//       sub: order.subtotal,
//       disc: order.discountTotal,
//       tax: order.taxTotal,
//       grand: order.grandTotal,
//     };
//   }, [order]);

//   const amountTendered = Number(amountStr || "0");
//   const change = Math.max(0, amountTendered - (totals.grand || 0));







//   async function inc(line: OrderItemDto) {
//     if (!order || !isUnpaid) return;
//     await updateItem({
//       id: order.orderId,
//       itemId: line.orderItemId,
//       body: { productId: line.productId, quantity: line.quantity + 1 },
//     }).unwrap();
//     refetch();
//   }
//   async function dec(line: OrderItemDto) {
//     if (!order || !isUnpaid) return;
//     const next = Math.max(1, line.quantity - 1);
//     await updateItem({
//       id: order.orderId,
//       itemId: line.orderItemId,
//       body: { productId: line.productId, quantity: next },
//     }).unwrap();
//     refetch();
//   }
//   async function removeLine(line: OrderItemDto) {
//     if (!order || !isUnpaid) return;
//     await removeItem({ id: order.orderId, itemId: line.orderItemId }).unwrap();
//     refetch();
//   }

//   function pressKey(k: string) {
//     setAmountStr(s => {
//       if (k === "CLR") return "0";
//       if (k === "DEL") return s.length <= 1 ? "0" : s.slice(0, -1);
//       if (k === "." && s.includes(".")) return s; // one dot
//       if (s === "0" && k !== ".") return k;
//       return s + k;
//     });
//   }

//   function quickTender(v: number) {
//     setAmountStr(String(Number(amountStr || "0") + v));
//   }

//   return (
//     <div className="pos-grid">
//       {/* LEFT: Cart pane */}
//       <section className="pos-left">
//         <div className="pos-left__head">

//           <div className="pos-scan" style={{ position: "relative" }}>
//   <input
//     autoFocus
//     className="pos-scan__input"
//     placeholder="Search by name (or type Product ID)"
//     value={query}
//     onChange={(e) => setQuery(e.target.value)}
//     onKeyDown={(e) => {
//       if (e.key === "Enter") {
//         const k = query.trim();
//         // if user typed a numeric ID, add immediately
//         const asNum = Number(k);
//         if (!Number.isNaN(asNum) && k !== "" && /^\d+$/.test(k)) {
//           addByProductId(asNum);
//           return;
//         }
//         // otherwise, pick first suggestion if available
//         if (suggestions.length > 0) addByProductId(suggestions[0].productId);
//       }
//     }}
//   />

//   {openSug && (
//     <div className="pos-suggest">
//       {searching && <div className="pos-suggest__item">Searching…</div>}
//       {!searching && suggestions.length === 0 && (
//         <div className="pos-suggest__item">No matches</div>
//       )}
//       {suggestions.map((s: ProductLite) => (
//         <button
//           key={s.productId}
//           className="pos-suggest__item"
//           onClick={() => addByProductId(s.productId)}
//         >
//           <div className="pos-suggest__name">{s.name}</div>
//           <div className="pos-suggest__meta">
//             #{s.productId} • LKR {s.unitPrice.toFixed(2)} • QOH {s.qtyOnHand}
//           </div>
//         </button>
//       ))}
//     </div>
//   )}
// </div>



//           <div className="pos-qty">
//             <button className="pos-qty__btn" onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
//             <input
//               className="pos-qty__val"
//               type="number"
//               min={1}
//               value={qty}
//               onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
//             />
//             <button className="pos-qty__btn" onClick={() => setQty(q => q + 1)}><FiPlus /></button>
//           </div>
//           {/* <button className="pos-add" onClick={addScanned} disabled={!isUnpaid || !barcode.trim() || adding || updating}>
//             <FiSearch /> Add
//           </button> */}
//           <button className="pos-refresh" onClick={() => refetch()} disabled={!order || isFetching}>
//             <FiRefreshCw />
//           </button>
//         </div>

//         <div className="pos-cart card">
//           <header className="pos-cart__head">
//             <div>
//               <div className="pos-order-no">{order?.orderNumber ?? "Creating…"}</div>
//               <div className="pos-subtext">Status: {order?.status ?? "-"}</div>
//             </div>
//             {order && (
//               <button
//                 className="pos-void"
//                 disabled={!isUnpaid || voiding}
//                 onClick={async () => {
//                   try { await voidOrder({ id: order.orderId }).unwrap(); refetch(); }
//                   catch (e: any) { alert(e?.data ?? "Failed to void order"); }
//                 }}
//               >
//                 <FiX /> Void
//               </button>
//             )}
//           </header>

//           <div className="pos-cart__body">
//             {!order || order.items.length === 0 ? (
//               <div className="pos-empty">No items yet — scan a product to begin.</div>
//             ) : (
//               <table className="pos-table">
//                 <thead>
//                   <tr>
//                     <th>Name</th>
//                     <th className="t-right">Unit</th>
//                     <th className="t-center">Qty</th>
//                     <th className="t-right">Total</th>
//                     <th className="t-center">Act</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {order.items.map(line => (
//                     <tr key={line.orderItemId}>
//                       <td>
//                         <div className="pos-name">{line.productNameSnapshot}</div>
//                         <div className="pos-subtext">#{line.productId}</div>
//                       </td>
//                       <td className="t-right">{line.unitPrice.toFixed(2)}</td>
//                       <td className="t-center">
//                         <div className="qty-inline">
//                           <button className="qty-inline__btn" disabled={!isUnpaid || updating} onClick={() => dec(line)}><FiMinus /></button>
//                           <span className="qty-inline__val">{line.quantity}</span>
//                           <button className="qty-inline__btn" disabled={!isUnpaid || updating} onClick={() => inc(line)}><FiPlus /></button>
//                         </div>
//                       </td>
//                       <td className="t-right">{line.lineTotal.toFixed(2)}</td>
//                       <td className="t-center">
//                         <button className="btn-chip btn-chip--danger" disabled={!isUnpaid || removing} onClick={() => removeLine(line)}>
//                           <FiTrash2 />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>

//           <footer className="pos-cart__foot">
//             <div className="row">
//               <span>Subtotal</span><span>{totals.sub.toFixed(2)}</span>
//             </div>
//             <div className="row">
//               <span>Discount</span><span>{totals.disc.toFixed(2)}</span>
//             </div>
//             <div className="row">
//               <span>Tax</span><span>{totals.tax.toFixed(2)}</span>
//             </div>
//             <div className="row grand">
//               <span>Grand Total</span><span>{totals.grand.toFixed(2)}</span>
//             </div>
//           </footer>
//         </div>
//       </section>

//       {/* RIGHT: Keypad & tender */}
//       <section className="pos-right">
//         <div className="pay-box card">
//           <div className="pay-line">
//             <label>Balance Due</label>
//             <div className="pay-val due">{totals.grand.toFixed(2)}</div>
//           </div>
//           <div className="pay-line">
//             <label>Amount Tendered</label>
//             <input
//               className="pay-input"
//               value={amountStr}
//               onChange={e => setAmountStr(e.target.value.replace(/[^\d.]/g, ""))}
//             />
//           </div>
//           <div className="pay-line">
//             <label>Change</label>
//             <div className="pay-val">{change.toFixed(2)}</div>
//           </div>

//           <div className="keypad">
//             {["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."].map(k => (
//               <button key={k} className={`key ${k === "C" ? "key--muted" : ""}`} onClick={() => pressKey(k === "C" ? "CLR" : k)}>
//                 {k === "C" ? "CLR" : k}
//               </button>
//             ))}
//             <button className="key key--muted" onClick={() => pressKey("DEL")}>DEL</button>
//           </div>

//           <div className="tenders">
//             {[100, 500, 1000, 5000].map(v => (
//               <button key={v} className="tender" onClick={() => quickTender(v)}>
//                 + {v.toLocaleString()}
//               </button>
//             ))}
//           </div>

//           <div className="pay-actions">
//             <button
//               className="btn-chip btn-chip--secondary btn-pay"
//               disabled={!order || !isUnpaid || paying || order.items.length === 0}
//               onClick={async () => {
//                 try {
//                   await payOrder({ id: order!.orderId, body: { changedByUserId: 0 } }).unwrap();

//                   // ✅ immediately start the next order
//                   const newId = await createOrder({ customerId: null }).unwrap();
//                   params.set("id", String(newId));
//                   setParams(params, { replace: true });

//                   // reset POS inputs
//                   setAmountStr("0");
//                   // comment these if you don’t have these fields:
//                   setBarcode?.("");
//                   setQty?.(1);

//                   // load the new order into the UI
//                   triggerGet(newId);
//                 } catch (e: any) {
//                   alert(e?.data ?? "Failed to pay order");
//                 }
//               }}
//             >
//               {/* your icon/text */}
//               <FiCreditCard /> Pay
//             </button>

//           </div>
//         </div>
//       </section>
//     </div>
//   );
// } 