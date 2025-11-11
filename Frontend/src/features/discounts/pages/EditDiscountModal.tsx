// src/features/discounts/components/EditDiscountModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiSave, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import {
    useGetDiscountByIdQuery,
    useUpdateDiscountMutation,
    useSetDiscountActiveMutation,
} from "../api";
import type { DiscountDetailsDto, DiscountUpdateDto } from "../types";
import { DISCOUNT_TYPES, DISCOUNT_SCOPES } from "../types";
import "./EditDiscountModal.css";

type Props = {
    id: number | null;
    show: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

function toLocalDTInputValue(isoOrNull: string | null): string {
    if (!isoOrNull) return "";
    const d = new Date(isoOrNull);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDTInputValue(v: string): string | null {
    const s = (v || "").trim();
    return s ? new Date(s).toISOString() : null;
}

export default function EditDiscountModal({ id, show, onClose, onUpdated }: Props) {
    const skip = !show || !id;
    const { data, isFetching, isError, refetch } = useGetDiscountByIdQuery(id ?? 0, { skip });
    const [update, { isLoading: saving }] = useUpdateDiscountMutation();
    const [setActive, { isLoading: toggling }] = useSetDiscountActiveMutation();

    // Local form state
    const [form, setForm] = useState<DiscountUpdateDto>({
        name: "",
        type: "Percent",
        value: 0,
        scope: "Global",
        isStackable: false, // default if backend doesn't send it
        priority: 0,
        startsAt: null,
        endsAt: null,
        minBasketSubtotal: null,
        maxTotalDiscount: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const active = (data?.isActive ?? false);

    useEffect(() => {
        if (!data || !show) return;
        const d: DiscountDetailsDto = data;
        const stackable = (d as unknown as { isStackable?: boolean }).isStackable ?? false;
        setForm({
            name: d.name,
            type: d.type,
            value: d.value,
            scope: d.scope,
            isStackable: stackable,
            priority: d.priority,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
            minBasketSubtotal: d.minBasketSubtotal,
            maxTotalDiscount: d.maxTotalDiscount,
        });
        setErrors({});
    }, [data, show]);

    function validate() {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!DISCOUNT_TYPES.includes(form.type)) e.type = "Invalid type";
        if (!DISCOUNT_SCOPES.includes(form.scope)) e.scope = "Invalid scope";
        if (form.value == null || Number(form.value) < 0) e.value = "Value must be ≥ 0";
        if (form.priority == null) e.priority = "Priority is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function onSave(ev: React.FormEvent) {
        ev.preventDefault();
        if (!id) return;
        if (!validate()) return;

        try {
            await update({ id, body: { ...form } }).unwrap();
            onUpdated?.();   // let parent refresh the list
            onClose();       // ✅ close the modal on success
        } catch (e: any) {
            alert(e?.data ?? "Failed to update discount");
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
            alert(e?.data ?? "Failed to toggle Active");
        }
    }

    if (!show) return null;
    const modalRoot = document.getElementById("modal-root") ?? document.body;

    return createPortal(
        <div className="disc-modal__overlay" onClick={onClose}>
            <div
                className="disc-modal" style={{ padding: 10, boxSizing: "border-box" }}
                onClick={(e) => e.stopPropagation() }
                role="dialog"
                aria-modal="true"
                aria-labelledby="editDiscountTitle"
            >
                {/* Header */}
                <div className="disc-modal__header">
                    <div className="disc-title" id="editDiscountTitle">
                        Edit Discount {id ? `#${id}` : ""}
                    </div>

                    <div className="disc-actions">
                        {!isFetching && (
                            <button
                                type="button"
                                className={`chip ${active ? "chip--ok" : "chip--warn"}`}
                                onClick={() => toggleActive(!active)}
                                disabled={toggling}
                                title={active ? "Click to deactivate" : "Click to activate"}
                            >
                                {active ? <FiToggleRight /> : <FiToggleLeft />} {active ? "Active" : "Inactive"}
                            </button>
                        )}
                        <button className="disc-close" onClick={onClose} aria-label="Close">
                            <FiX />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form className="disc-modal__body" onSubmit={onSave} >
                    {isError && <div className="err" style={{ marginBottom: 12 }}>Failed to load discount.</div>}
                    {isFetching && <div className="hint" style={{ marginBottom: 12 }}>Loading…</div>}

                    <div className="grid-2">
                        <div>
                            <label className="label">Name</label>
                            <input
                                className={`input ${errors.name ? "is-invalid" : ""}`}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Black Friday 20%"
                            />
                            {errors.name && <div className="err">{errors.name}</div>}
                        </div>

                        <div>
                            <label className="label">Priority</label>
                            <input
                                type="number"
                                className={`input ${errors.priority ? "is-invalid" : ""}`}
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: Number(e.target.value || 0) })}
                            />
                            {errors.priority && <div className="err">{errors.priority}</div>}
                        </div>

                        <div>
                            <label className="label">Type</label>
                            <select
                                className={`input ${errors.type ? "is-invalid" : ""}`}
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as DiscountUpdateDto["type"] })}
                            >
                                {DISCOUNT_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {errors.type && <div className="err">{errors.type}</div>}
                        </div>

                        <div>
                            <label className="label">Value {form.type === "Percent" && "(%)"}</label>
                            <input
                                type="number"
                                step="0.01"
                                min={0}
                                className={`input ${errors.value ? "is-invalid" : ""}`}
                                value={form.value}
                                onChange={(e) => setForm({ ...form, value: Number(e.target.value || 0) })}
                                placeholder="20 for 20% or 500 for LKR 500"
                            />
                            {errors.value && <div className="err">{errors.value}</div>}
                        </div>

                        <div>
                            <label className="label">Scope</label>
                            <select
                                className={`input ${errors.scope ? "is-invalid" : ""}`}
                                value={form.scope}
                                onChange={(e) => setForm({ ...form, scope: e.target.value as DiscountUpdateDto["scope"] })}
                            >
                                {DISCOUNT_SCOPES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {errors.scope && <div className="err">{errors.scope}</div>}
                        </div>

                        <div className="toggle">
                            <label className="label">Stackable</label>
                            <input
                                type="checkbox"
                                checked={form.isStackable}
                                onChange={(e) => setForm({ ...form, isStackable: e.target.checked })}
                            />
                        </div>

                        <div>
                            <label className="label">Starts At</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={toLocalDTInputValue(form.startsAt ?? null)}
                                onChange={(e) =>
                                    setForm({ ...form, startsAt: fromLocalDTInputValue(e.target.value) })
                                }
                            />
                        </div>

                        <div>
                            <label className="label">Ends At</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={toLocalDTInputValue(form.endsAt ?? null)}
                                onChange={(e) =>
                                    setForm({ ...form, endsAt: fromLocalDTInputValue(e.target.value) })
                                }
                            />
                        </div>

                        <div>
                            <label className="label">Min Basket Subtotal</label>
                            <input
                                type="number"
                                step="0.01"
                                min={0}
                                className="input"
                                value={form.minBasketSubtotal ?? 0}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        minBasketSubtotal: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="label">Max Total Discount</label>
                            <input
                                type="number"
                                step="0.01"
                                min={0}
                                className="input"
                                value={form.maxTotalDiscount ?? 0}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        maxTotalDiscount: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="disc-modal__footer">
                    <button className="btn-chip" onClick={onClose} type="button">Close</button>
                    <button
                        className="btn-chip btn-chip--secondary"
                        onClick={onSave as any}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : (
                            <>
                                <FiSave style={{ marginRight: 6 }} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
}
















