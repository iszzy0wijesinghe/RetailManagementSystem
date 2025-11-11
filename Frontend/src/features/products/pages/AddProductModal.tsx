

import { useEffect, useMemo, useState } from "react";
import { FiXCircle } from "react-icons/fi";
import { useCreateProductMutation, useGetCategoriesQuery } from "../api";
import type { ProductCreateDto, Category } from "../types";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/AddProductModal.css";

type Props = {
  show: boolean;
  onClose: () => void;
  onCreated?: (newId: number) => void;
};

export default function AddProductModal({ show, onClose, onCreated }: Props) {
  const { data: cats, isLoading: catsLoading, isError: catsError } = useGetCategoriesQuery();
  const [create, { isLoading }] = useCreateProductMutation();

  // only active categories (frontend filter)
  const activeCategories = useMemo(
    () => (cats ?? []).filter((c: Category) => c.isActive),
    [cats]
  );

  const [form, setForm] = useState<ProductCreateDto>({
    categoryId: 0,
    name: "",
    description: "",
    unitPrice: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Optionally auto-select first active category when modal opens
  useEffect(() => {
    if (!show) return;
    setErrors({});
    if (activeCategories.length && !form.categoryId) {
      setForm((f) => ({ ...f, categoryId: activeCategories[0].categoryId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, activeCategories.length]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.categoryId) e.categoryId = "Select a category";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.unitPrice === null || form.unitPrice === undefined || Number(form.unitPrice) < 0) {
      e.unitPrice = "Unit Price must be 0 or more";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload: ProductCreateDto = {
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        description: form.description?.trim() || "",
        unitPrice: Number(form.unitPrice),
      };
      const newId = await create(payload).unwrap();
      onCreated?.(Number(newId));
      onClose();
      setForm({ categoryId: 0, name: "", description: "", unitPrice: 0 });
    } catch (err: any) {
      alert(err?.data ?? "Failed to add product");
      console.error(err);
    }
  }

  if (!show) return null;

  const noActive = !catsLoading && !catsError && activeCategories.length === 0;

  return (
    <div className="modal fade show rms-add-modal" style={{ display: "block", background: "rgba(0,0,0,.6)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h3 className="fw-bold mb-0">Add New Product</h3>
            <button type="button" className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1" onClick={onClose}>
              <FiXCircle /> Close
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="row g-4">
                {/* Left column */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Product Category</label>
                  <select
                    className={`form-select form-select-lg rounded-3 ${errors.categoryId ? "is-invalid" : ""}`}
                    value={form.categoryId || 0}
                    onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                    disabled={catsLoading || noActive}
                  >
                    {/* Placeholder row */}
                    <option value={0} disabled>
                      {catsLoading ? "Loading…" : noActive ? "No active categories" : "Select a category"}
                    </option>
                    {activeCategories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Only active categories are listed.</div>
                  {errors.categoryId && <div className="invalid-feedback d-block">{errors.categoryId}</div>}

                  <div className="mt-4">
                    <label className="form-label fw-bold">Product Name</label>
                    <input
                      className={`form-control form-control-lg rounded-3 ${errors.name ? "is-invalid" : ""}`}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                  </div>

                  <div className="mt-4">
                    <label className="form-label fw-bold">Product Description</label>
                    <textarea
                      className="form-control rounded-3"
                      rows={3}
                      value={form.description ?? ""}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right column */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Unit Price</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text rounded-start-3">LKR</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className={`form-control rounded-end-3 ${errors.unitPrice ? "is-invalid" : ""}`}
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-text">Unit Price can’t be empty</div>
                  {errors.unitPrice && <div className="invalid-feedback d-block">{errors.unitPrice}</div>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="submit" className="btn btn-add-primary" disabled={isLoading || noActive}>
                {isLoading ? "Adding…" : "Add Product"}
              </button>
              <button type="button" className="btn btn-outline-secondary btn-add-outline" onClick={onClose}>
                Cancel
              </button>
            </div>

            {noActive && (
              <div className="px-4 pb-3">
                <small className="text-danger">No active categories found. Create/activate a category first.</small>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

















// import { useEffect, useMemo, useState } from "react";
// import { FiXCircle } from "react-icons/fi";
// import { useCreateProductMutation, useGetCategoriesQuery } from "../api";
// import type { ProductCreateDto, Category } from "../types";

// // If Bootstrap CSS is already imported globally (e.g., in main.tsx), you can remove this line.
// import "bootstrap/dist/css/bootstrap.min.css";
// // NOTE: adjust the import path if your styles folder differs.
// // From /features/products/pages -> /src/styles
// import "../styles/AddProductModal.css";

// type Props = {
//   show: boolean;
//   onClose: () => void;
//   onCreated?: (newId: number) => void;
// };

// export default function AddProductModal({ show, onClose, onCreated }: Props) {
//   const { data: cats, isLoading: catsLoading } = useGetCategoriesQuery();
//   const [create, { isLoading }] = useCreateProductMutation();

//   const activeCategories = useMemo(
//     () => (cats ?? []).filter((c: Category) => c.isActive),
//     [cats]
//   );

//   const [form, setForm] = useState<ProductCreateDto>({
//     categoryId: 0,
//     name: "",
//     description: "",
//     unitPrice: 0,
//   });
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   useEffect(() => {
//     if (show) {
//       setErrors({});
//       if (activeCategories.length && !form.categoryId) {
//         setForm((f) => ({ ...f, categoryId: activeCategories[0].categoryId }));
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, activeCategories.length]);

//   function validate() {
//     const e: Record<string, string> = {};
//     if (!form.categoryId) e.categoryId = "Select a category";
//     if (!form.name.trim()) e.name = "Name is required";
//     if (
//       form.unitPrice === null ||
//       form.unitPrice === undefined ||
//       Number(form.unitPrice) < 0
//     )
//       e.unitPrice = "Unit Price must be 0 or more";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!validate()) return;
//     try {
//       const id = await create({
//         categoryId: Number(form.categoryId),
//         name: form.name.trim(),
//         description: form.description?.trim() || "",
//         unitPrice: Number(form.unitPrice),
//       }).unwrap();

//       onCreated?.(id);
//       onClose();
//       setForm({ categoryId: 0, name: "", description: "", unitPrice: 0 });
//     } catch (err: any) {
//       alert(err?.data ?? "Failed to add product");
//       console.error(err);
//     }
//   }

//   if (!show) return null;

//   return (
//     <div
//       className="modal fade show rms-add-modal"
//       style={{ display: "block", background: "rgba(0,0,0,.6)" }}
//     >
//       <div className="modal-dialog modal-xl modal-dialog-centered">
//         <div className="modal-content">
//           {/* Header */}
//           <div className="modal-header">
//             <h3 className="fw-bold mb-0">Add New Product</h3>
//             <button
//               type="button"
//               className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1"
//               onClick={onClose}
//             >
//               <FiXCircle /> Close
//             </button>
//           </div>

//           {/* Form */}
//           <form onSubmit={onSubmit}>
//             <div className="modal-body">
//               <div className="row g-4">
//                 {/* Left column */}
//                 <div className="col-md-6">
//                   <label className="form-label fw-bold">Product Category</label>
//                   <select
//                     className={`form-select form-select-lg rounded-3 ${
//                       errors.categoryId ? "is-invalid" : ""
//                     }`}
//                     value={form.categoryId || 0}
//                     onChange={(e) =>
//                       setForm({ ...form, categoryId: Number(e.target.value) })
//                     }
//                     disabled={catsLoading}
//                   >
//                     {activeCategories.length === 0 && (
//                       <option value={0}>Loading…</option>
//                     )}
//                     {activeCategories.map((c) => (
//                       <option key={c.categoryId} value={c.categoryId}>
//                         {c.name}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="form-text">
//                     Select existing product category from dropdown
//                   </div>
//                   {errors.categoryId && (
//                     <div className="invalid-feedback d-block">
//                       {errors.categoryId}
//                     </div>
//                   )}

//                   <div className="mt-4">
//                     <label className="form-label fw-bold">Product Name</label>
//                     <input
//                       className={`form-control form-control-lg rounded-3 ${
//                         errors.name ? "is-invalid" : ""
//                       }`}
//                       value={form.name}
//                       onChange={(e) =>
//                         setForm({ ...form, name: e.target.value })
//                       }
//                     />
//                     {errors.name && (
//                       <div className="invalid-feedback d-block">
//                         {errors.name}
//                       </div>
//                     )}
//                   </div>

//                   <div className="mt-4">
//                     <label className="form-label fw-bold">
//                       Product Description
//                     </label>
//                     <textarea
//                       className="form-control rounded-3"
//                       rows={3}
//                       value={form.description ?? ""}
//                       onChange={(e) =>
//                         setForm({ ...form, description: e.target.value })
//                       }
//                     />
//                   </div>
//                 </div>

//                 {/* Right column */}
//                 <div className="col-md-6">
//                   <label className="form-label fw-bold">Unit Price</label>
//                   <div className="input-group input-group-lg">
//                     <span className="input-group-text rounded-start-3">LKR</span>
//                     <input
//                       type="number"
//                       step="0.01"
//                       min={0}
//                       className={`form-control rounded-end-3 ${
//                         errors.unitPrice ? "is-invalid" : ""
//                       }`}
//                       value={form.unitPrice}
//                       onChange={(e) =>
//                         setForm({
//                           ...form,
//                           unitPrice: Number(e.target.value),
//                         })
//                       }
//                     />
//                   </div>
//                   <div className="form-text">Unit Price can’t be empty</div>
//                   {errors.unitPrice && (
//                     <div className="invalid-feedback d-block">
//                       {errors.unitPrice}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="modal-footer">
//               <button
//                 type="submit"
//                 className="btn btn-add-primary"
//                 disabled={isLoading}
//               >
//                 {isLoading ? "Adding…" : "Add Product"}
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-outline-secondary btn-add-outline"
//                 onClick={onClose}
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
