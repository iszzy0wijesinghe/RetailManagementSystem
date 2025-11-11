import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiSave } from "react-icons/fi";
import {
  useGetCategoryByIdQuery,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../api";
import type {
  CategoryDetailsDto,
  CategoryUpdateDto,
  CategoryListItem,
} from "../types";
import "./CategoryEditModal.css";

type Props = {
  id: number | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditCategoryModal({
  id,
  open,
  onClose,
  onUpdated,
}: Props) {
  const skip = !open || !id;
  const {
    data: cat,
    isFetching,
    isError,
  } = useGetCategoryByIdQuery(id ?? 0, { skip });
  const { data: all = [] } = useGetCategoriesQuery({ includeInactive: true });
  const [update, { isLoading: saving }] = useUpdateCategoryMutation();

  const [form, setForm] = useState<CategoryUpdateDto>({
    name: "",
    parentCategoryId: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parentOptions = useMemo<CategoryListItem[]>(
    () =>
      all.filter(
        (c: CategoryListItem) => c.isActive && c.categoryId !== (id ?? -1)
      ),
    [all, id]
  );

  useEffect(() => {
    if (!cat || !open) return;
    const d: CategoryDetailsDto = cat;
    setForm({ name: d.name, parentCategoryId: d.parentCategoryId });
    setErrors({});
  }, [cat, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (id && form.parentCategoryId === id)
      e.parentCategoryId = "Category cannot be its own parent";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!id) return;
    if (!validate()) return;
    try {
      await update({
        id,
        body: {
          name: form.name.trim(),
          parentCategoryId: form.parentCategoryId,
        },
      }).unwrap();
      onUpdated?.();
      onClose(); // close after save (you asked for this behavior for discounts too)
    } catch (e: any) {
      alert(e?.data ?? "Failed to update category");
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
      >
        <header className="cat-modal__head">
          <h3>Edit Category {id ? `#${id}` : ""}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </header>

        <form className="cat-modal__body" onSubmit={onSave}>
          {isError && (
            <div className="alert alert--error">Failed to load category.</div>
          )}
          {isFetching && <div className="loading">Loading…</div>}

          {!isFetching && cat && (
            <>
              <label className="lbl">Name</label>
              <input
                className={`inp ${errors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              {errors.name && <div className="err">{errors.name}</div>}

              <label className="lbl">Parent Category (optional)</label>
              <select
                className={`inp ${errors.parentCategoryId ? "is-invalid" : ""}`}
                value={form.parentCategoryId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parentCategoryId:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              >
                <option value="">— None —</option>
                {parentOptions.map((c: CategoryListItem) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.parentCategoryId && (
                <div className="err">{errors.parentCategoryId}</div>
              )}
            </>
          )}
        </form>

        <footer className="cat-modal__foot">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            onClick={onSave as any}
            disabled={saving || isFetching}
          >
            <FiSave /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </div>
    </div>,
    modalRoot
  );
}
