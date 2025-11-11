// src/features/inventory/components/AdjustStockModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPlusCircle, FiMinusCircle, FiX } from "react-icons/fi";
import { useAdjustStockMutation } from "../api";
import type { AdjustStockDto } from "../types";
import { useModalTransition } from "../../../reusablehooks/useModalTransition";
import "../../../reusablehooks/Modal.anim.css";
import "../styles/AdjustStockModal.css";

type Props = {
  productId: number | null;
  show: boolean;
  onClose: () => void;
  onAdjusted?: () => void;
};

export default function AdjustStockModal({
  productId,
  show,
  onClose,
  onAdjusted,
}: Props) {
  // ⚠️ All hooks at the top, unconditionally
  const { mounted, phase, openKey } = useModalTransition(show, 320);
  const [mutate, { isLoading }] = useAdjustStockMutation();
  const [qty, setQty] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // Lock scroll + ESC to close
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [show, onClose]);

  async function submit(delta: number) {
    if (!productId || delta === 0) return;
    const payload: AdjustStockDto = {
      productId,
      quantityDelta: delta,
      note: note.trim() || undefined,
    };
    try {
      await mutate(payload).unwrap();
      onAdjusted?.();
      onClose();
      setQty(0);
      setNote("");
    } catch (e) {
      alert("Failed to adjust stock");
      console.error(e);
    }
  }

  // Only after all hooks:
  if (!mounted) return null;

  const modalRoot = document.getElementById("modal-root") ?? document.body;

  const modal = (
    <div
      className={`rms-modal rms-stock-modal ${
        phase === "exit" ? "is-exit" : "is-enter"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjustStockTitle"
    >
      <div className="rms-modal__backdrop" onClick={onClose} />
      <div
        key={openKey}
        className="rms-modal__dialog modal-dialog modal-dialog-centered"
      >
        <div className="modal-content adjust-modal">
          <div className="modal-header">
            <h4 id="adjustStockTitle" className="mb-0">
              Adjust Stock {productId ? `#${productId}` : ""}
            </h4>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="grid">
              <div className="field">
                <label className="label">Quantity</label>
                <input
                  type="number"
                  className="input"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  placeholder="e.g. 10 or -5"
                />
                <small className="hint">
                  Use positive for stock-in, negative for stock-out.
                </small>
              </div>

              <div className="field">
                <label className="label">Note (optional)</label>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-chip btn-chip--secondary"
              disabled={isLoading || qty <= 0}
              onClick={() => submit(Math.abs(qty) * -1)}
              title="Stock Out"
            >
              <FiMinusCircle /> Stock Out
            </button>
            <button
              className="btn-chip btn-chip--secondary"
              disabled={isLoading || qty <= 0}
              onClick={() => submit(Math.abs(qty))}
              title="Stock In"
            >
              <FiPlusCircle /> Stock In
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, modalRoot);
}










// // src/features/inventory/components/AdjustStockModal.tsx
// import { useState } from 'react';
// import { FiPlusCircle, FiMinusCircle, FiX } from 'react-icons/fi';
// import { useAdjustStockMutation } from '../api';
// import type { AdjustStockDto } from '../types';
// import { useModalTransition } from '../../../reusablehooks/useModalTransition';
// import '../../../reusablehooks/Modal.anim.css';
// import '../styles/AdjustStockModal.css';

// type Props = {
//   productId: number | null;
//   show: boolean;
//   onClose: () => void;
//   onAdjusted?: () => void;
// };

// export default function AdjustStockModal({ productId, show, onClose, onAdjusted }: Props) {
//   const { mounted, phase, openKey } = useModalTransition(show, 320);
//   const [mutate, { isLoading }] = useAdjustStockMutation();
//   const [qty, setQty] = useState<number>(0);
//   const [note, setNote] = useState<string>('');

//   if (!mounted) return null;

//   async function submit(delta: number) {
//     if (!productId || delta === 0) return;
//     const payload: AdjustStockDto = { productId, quantityDelta: delta, note: note.trim() || undefined };
//     try {
//       await mutate(payload).unwrap();
//       onAdjusted?.();
//       onClose();
//       setQty(0); setNote('');
//     } catch (e) {
//       alert('Failed to adjust stock');
//       console.error(e);
//     }
//   }

//   return (
//     <div className={`rms-modal ${phase === 'exit' ? 'is-exit' : 'is-enter'}`} role="dialog" aria-modal="true">
//       <div className="rms-modal__backdrop" onClick={onClose} />
//       <div key={openKey} className="rms-modal__dialog modal-dialog modal-dialog-centered">
//         <div className="modal-content adjust-modal">
//           <div className="modal-header">
//             <h4 className="mb-0">Adjust Stock {productId ? `#${productId}` : ''}</h4>
//             <button className="icon-btn" onClick={onClose} aria-label="Close"><FiX /></button>
//           </div>

//           <div className="modal-body">
//             <div className="grid">
//               <div className="field">
//                 <label className="label">Quantity</label>
//                 <input
//                   type="number"
//                   className="input"
//                   value={qty}
//                   onChange={(e) => setQty(Number(e.target.value))}
//                   placeholder="e.g. 10 or -5"
//                 />
//                 <small className="hint">Use positive for stock-in, negative for stock-out.</small>
//               </div>

//               <div className="field">
//                 <label className="label">Note (optional)</label>
//                 <input
//                   className="input"
//                   value={note}
//                   onChange={(e) => setNote(e.target.value)}
//                   placeholder="Reason for adjustment"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="modal-footer">
//             <button
//               className="btn-chip btn-chip--secondary"
//               disabled={isLoading || qty <= 0}
//               onClick={() => submit(Math.abs(qty) * -1)}
//               title="Stock Out"
//             >
//               <FiMinusCircle /> Stock Out
//             </button>
//             <button
//               className="btn-chip btn-chip--secondary"
//               disabled={isLoading || qty <= 0}
//               onClick={() => submit(Math.abs(qty))}
//               title="Stock In"
//             >
//               <FiPlusCircle /> Stock In
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
