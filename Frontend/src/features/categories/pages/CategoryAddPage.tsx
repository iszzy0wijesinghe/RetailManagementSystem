import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiSave } from "react-icons/fi";
import { useCreateCategoryMutation, useGetCategoriesQuery } from "../api";
import type { CategoryCreateDto, CategoryListItem } from "../types";
import "./CategoryAddModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddCategoryModal({ open, onClose, onCreated }: Props) {
  const { data: all = [] } = useGetCategoriesQuery({ includeInactive: true });
  const [create, { isLoading }] = useCreateCategoryMutation();

  const [form, setForm] = useState<CategoryCreateDto>({
    name: "",
    parentCategoryId: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  // reset + focus when opened
  useEffect(() => {
    if (open) {
      setForm({ name: "", parentCategoryId: null });
      setErrors({});
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await create({ ...form, name: form.name.trim() }).unwrap();
      onCreated?.();
      onClose();
    } catch (e: any) {
      alert(e?.data ?? "Failed to create category");
    }
  }

  if (!open) return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div className="cat-modal__overlay" onClick={onClose}>
      <div
        className="cat-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cat-title"
      >
        <header className="cat-modal__head">
          <h3 id="add-cat-title">New Category</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </header>

        <form id="add-category-form" className="cat-modal__body" onSubmit={onSubmit}>
          <label className="lbl" htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            ref={inputRef}
            className={`inp ${errors.name ? "is-invalid" : ""}`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="off"
          />
          {errors.name && <div className="err" role="alert">{errors.name}</div>}

          <label className="lbl" htmlFor="cat-parent">Parent Category (optional)</label>
          <select
            id="cat-parent"
            className="inp"
            value={form.parentCategoryId ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                parentCategoryId: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          >
            <option value="">— None —</option>
            {all
              .filter((c: CategoryListItem) => c.isActive)
              .map((c: CategoryListItem) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
          </select>
        </form>

        <footer className="cat-modal__foot">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            form="add-category-form"
            type="submit"
            className="btn btn--primary"
            disabled={isLoading}
          >
            <FiSave /> {isLoading ? "Saving…" : "Create"}
          </button>
        </footer>
      </div>
    </div>,
    modalRoot
  );
}
