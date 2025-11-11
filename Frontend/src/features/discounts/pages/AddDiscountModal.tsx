// src/features/discounts/components/AddDiscountModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useCreateDiscountMutation } from "../api";
import { DISCOUNT_TYPES, DISCOUNT_SCOPES } from "../types";
import type { DiscountCreateDto } from "../types";
import "./AddDiscountModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddDiscountModal({ open, onClose }: Props) {
  const [create, { isLoading }] = useCreateDiscountMutation();
  const [form, setForm] = useState<DiscountCreateDto>({
    name: "",
    type: "Percent",
    value: 0,
    scope: "Global",
    isStackable: false,
    priority: 0,
    startsAt: null,
    endsAt: null,
    minBasketSubtotal: null,
    maxTotalDiscount: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (!open) setErrors({}); }, [open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!DISCOUNT_TYPES.includes(form.type as any)) e.type = "Invalid type";
    if (!DISCOUNT_SCOPES.includes(form.scope as any)) e.scope = "Invalid scope";
    if (form.value < 0) e.value = "Value must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await create(form).unwrap();
      onClose();
    } catch (e: any) {
      alert(e?.data ?? "Failed to create discount");
    }
  }

  if (!open) return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div className="disc-modal__overlay" onClick={onClose}>
      <div className="disc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="disc-modal__header">
          <div className="disc-title">New Discount</div>
          <button className="disc-close" onClick={onClose}><FiX /></button>
        </div>

        <form className="disc-modal__body" onSubmit={onSubmit}>
          <div className="grid-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <div className="err">{errors.name}</div>}
            </div>

            <div>
              <label className="label">Priority</label>
              <input type="number" className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value || 0) })} />
            </div>

            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Value {form.type === "Percent" && "(%)"}</label>
              <input type="number" step="0.01" min={0} className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value || 0) })} />
              {errors.value && <div className="err">{errors.value}</div>}
            </div>

            <div>
              <label className="label">Scope</label>
              <select className="input" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })}>
                {DISCOUNT_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.scope && <div className="err">{errors.scope}</div>}
            </div>

            <div className="toggle">
              <label className="label">Stackable</label>
              <input type="checkbox" checked={form.isStackable} onChange={(e) => setForm({ ...form, isStackable: e.target.checked })} />
            </div>

            <div>
              <label className="label">Starts At</label>
              <input type="datetime-local" className="input" value={form.startsAt ?? ""}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value || null })} />
            </div>

            <div>
              <label className="label">Ends At</label>
              <input type="datetime-local" className="input" value={form.endsAt ?? ""}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value || null })} />
            </div>

            <div>
              <label className="label">Min Basket Subtotal</label>
              <input type="number" step="0.01" min={0} className="input"
                value={form.minBasketSubtotal ?? 0}
                onChange={(e) => setForm({ ...form, minBasketSubtotal: e.target.value ? Number(e.target.value) : null })} />
            </div>

            <div>
              <label className="label">Max Total Discount</label>
              <input type="number" step="0.01" min={0} className="input"
                value={form.maxTotalDiscount ?? 0}
                onChange={(e) => setForm({ ...form, maxTotalDiscount: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
        </form>

        <div className="disc-modal__footer">
          <button className="btn-chip" onClick={onClose} type="button">Cancel</button>
          <button className="btn-chip btn-chip--secondary" onClick={onSubmit as any} disabled={isLoading}>
            {isLoading ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
