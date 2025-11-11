// src/features/products/components/EditProductModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiXCircle } from "react-icons/fi";
import {
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useUpdateProductMutation,
} from "../api";
import type { Category, ProductUpdateDto } from "../types";
import { useModalTransition } from "../../../reusablehooks/useModalTransition";
import "../../../reusablehooks/Modal.anim.css";
import "../styles/EditProductModal.css";

type Props = {
  productId: number | null;
  show: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditProductModal({
  productId,
  show,
  onClose,
  onUpdated,
}: Props) {
  const skip = !show || !productId;

  const { data: product, isLoading: loadingProduct, isError } =
    useGetProductByIdQuery(productId as number, { skip });
  const { data: cats, isLoading: catsLoading } =
    useGetCategoriesQuery(undefined, { skip });
  const [update, { isLoading: isSaving }] = useUpdateProductMutation();

  // enter/exit timing for CSS transition (already in your project)
  const { mounted, phase } = useModalTransition(show, 220);

  const categories = useMemo(
    () => (cats ?? []).filter((c: Category) => c.isActive),
    [cats]
  );

  const [form, setForm] = useState<ProductUpdateDto>({
    categoryId: 0,
    name: "",
    description: "",
    unitPrice: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && show) {
      setForm({
        categoryId: product.categoryId,
        name: product.name,
        description: product.description ?? "",
        unitPrice: product.unitPrice,
        isActive: product.isActive,
      });
      setErrors({});
    }
  }, [product, show]);

  // Lock background scroll + Esc to close while open
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [show, onClose]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.categoryId) e.categoryId = "Select a category";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.unitPrice == null || Number(form.unitPrice) < 0)
      e.unitPrice = "Unit Price must be 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!productId || !validate()) return;
    try {
      await update({
        id: productId,
        body: {
          categoryId: Number(form.categoryId),
          name: form.name.trim(),
          description: (form.description ?? "").trim(),
          unitPrice: Number(form.unitPrice),
          isActive: Boolean(form.isActive),
        },
      }).unwrap();
      onUpdated?.();
      onClose();
    } catch (err: any) {
      alert(err?.data ?? "Failed to update product");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (!mounted) return null;

  const modalRoot = document.getElementById("modal-root") ?? document.body;

  const modal = (
    <div
      className={`rms-modal rms-edit-modal ${phase === "exit" ? "is-exit" : "is-enter"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editProductTitle"
    >
      {/* Fullscreen backdrop */}
      <div className="rms-modal__backdrop" onClick={onClose} />

      {/* Centered dialog (Bootstrap-safe) */}
      <div className="rms-modal__dialog modal-dialog modal-xl">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h3 id="editProductTitle" className="fw-bold mb-0">
              Edit Product {productId ? `#${productId}` : ""}
            </h3>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1"
              onClick={onClose}
            >
              <FiXCircle /> Close
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {isError && (
              <div className="alert alert-danger mb-3">
                Failed to load product.
              </div>
            )}

            {loadingProduct ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" role="status" />
              </div>
            ) : (
              <form onSubmit={onSubmit} id="editProductForm">
                <div className="row g-4">
                  {/* Left column */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Product Category</label>
                    <select
                      className={`form-select form-select-lg rounded-3 ${errors.categoryId ? "is-invalid" : ""}`}
                      value={form.categoryId || 0}
                      onChange={(e) =>
                        setForm({ ...form, categoryId: Number(e.target.value) })
                      }
                      disabled={catsLoading}
                    >
                      {categories.length === 0 && (
                        <option value={0}>Loading…</option>
                      )}
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <div className="invalid-feedback d-block">
                        {errors.categoryId}
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="form-label fw-bold">Product Name</label>
                      <input
                        className={`form-control form-control-lg rounded-3 ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                      {errors.name && (
                        <div className="invalid-feedback d-block">
                          {errors.name}
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-bold">
                        Product Description
                      </label>
                      <textarea
                        className="form-control rounded-3"
                        rows={3}
                        value={form.description ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
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
                        onChange={(e) =>
                          setForm({
                            ...form,
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    {errors.unitPrice && (
                      <div className="invalid-feedback d-block">
                        {errors.unitPrice}
                      </div>
                    )}

                    <div className="mt-4">
                      <label htmlFor="isActiveSwitch" className="rms-toggle">
                        <input
                          id="isActiveSwitch"
                          type="checkbox"
                          checked={!!form.isActive}
                          onChange={(e) =>
                            setForm({ ...form, isActive: e.target.checked })
                          }
                        />
                        <span className="rms-toggle__track">
                          <span className="rms-toggle__thumb" />
                        </span>
                        <span
                          className={`rms-toggle__text ${
                            form.isActive ? "on" : "off"
                          }`}
                        >
                          {form.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>

                      <div className="form-text mt-1">
                        Turning a product inactive hides it from active listings.
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="submit"
              form="editProductForm"
              className="btn btn-edit-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-edit-outline"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, modalRoot);
}












// import { useEffect, useMemo, useState } from "react";
// import { FiXCircle } from "react-icons/fi";
// import {
//   useGetProductByIdQuery,
//   useGetCategoriesQuery,
//   useUpdateProductMutation,
// } from "../api";
// import type { Category, ProductUpdateDto } from "../types";
// import { useModalTransition } from "../../../reusablehooks/useModalTransition";
// import "../../../reusablehooks/Modal.anim.css";
// import "../styles/EditProductModal.css";

// type Props = {
//   productId: number | null;   // id of the product to edit
//   show: boolean;              // modal visible?
//   onClose: () => void;        // close handler
//   onUpdated?: () => void;     // refetch list after save
// };

// export default function EditProductModal({ productId, show, onClose, onUpdated }: Props) {
//   const skip = !show || !productId;
//   const { data: product, isLoading: loadingProduct, isError } =
//     useGetProductByIdQuery(productId as number, { skip });
//   const { data: cats, isLoading: catsLoading } =
//     useGetCategoriesQuery(undefined, { skip });
//   const [update, { isLoading: isSaving }] = useUpdateProductMutation();

//   // animation control
//   const { mounted, phase } = useModalTransition(show, 220);

//   const categories = useMemo(
//     () => (cats ?? []).filter((c: Category) => c.isActive),
//     [cats]
//   );

//   const [form, setForm] = useState<ProductUpdateDto>({
//     categoryId: 0,
//     name: "",
//     description: "",
//     unitPrice: 0,
//     isActive: true,
//   });
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   useEffect(() => {
//     if (product && show) {
//       setForm({
//         categoryId: product.categoryId,
//         name: product.name,
//         description: product.description ?? "",
//         unitPrice: product.unitPrice,
//         isActive: product.isActive,
//       });
//       setErrors({});
//     }
//   }, [product, show]);

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

//   async function onSubmit(ev: React.FormEvent) {
//     ev.preventDefault();
//     if (!productId) return;
//     if (!validate()) return;

//     try {
//       await update({
//         id: productId,
//         body: {
//           categoryId: Number(form.categoryId),
//           name: form.name.trim(),
//           description: (form.description ?? "").trim(),
//           unitPrice: Number(form.unitPrice),
//           isActive: Boolean(form.isActive),
//         },
//       }).unwrap();
//       onUpdated?.();
//       onClose();
//     } catch (err: any) {
//       alert(err?.data ?? "Failed to update product");
//       console.error(err);
//     }
//   }

//   // Keep mounted long enough to animate the close
//   if (!mounted) return null;

//   const modalRoot = document.getElementById("modal-root") ?? document.body;
//   return (
//     <div
//       className={`rms-modal rms-edit-modal ${phase === "exit" ? "is-exit" : "is-enter"}`}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="editProductTitle"
//     >
//       {/* Backdrop (click to close) */}
//       <div className="rms-modal__backdrop" onClick={onClose} />

//       {/* Dialog (keeps your existing Bootstrap modal content inside) */}
//       <div className="rms-modal__dialog modal-dialog modal-xl modal-dialog-centered">
//         <div className="modal-content">
//           {/* Header */}
//           <div className="modal-header">
//             <h3 id="editProductTitle" className="fw-bold mb-0">
//               Edit Product {productId ? `#${productId}` : ""}
//             </h3>
//             <button
//               type="button"
//               className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1"
//               onClick={onClose}
//             >
//               <FiXCircle /> Close
//             </button>
//           </div>

//           {/* Body */}
//           <div className="modal-body">
//             {isError && (
//               <div className="alert alert-danger mb-3">
//                 Failed to load product.
//               </div>
//             )}

//             {loadingProduct ? (
//               <div className="d-flex justify-content-center py-5">
//                 <div className="spinner-border" role="status" />
//               </div>
//             ) : (
//               <form onSubmit={onSubmit} id="editProductForm">
//                 <div className="row g-4">
//                   {/* Left column */}
//                   <div className="col-md-6">
//                     <label className="form-label fw-bold">Product Category</label>
//                     <select
//                       className={`form-select form-select-lg rounded-3 ${errors.categoryId ? "is-invalid" : ""}`}
//                       value={form.categoryId || 0}
//                       onChange={(e) =>
//                         setForm({ ...form, categoryId: Number(e.target.value) })
//                       }
//                       disabled={catsLoading}
//                     >
//                       {categories.length === 0 && (
//                         <option value={0}>Loading…</option>
//                       )}
//                       {categories.map((c) => (
//                         <option key={c.categoryId} value={c.categoryId}>
//                           {c.name}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.categoryId && (
//                       <div className="invalid-feedback d-block">
//                         {errors.categoryId}
//                       </div>
//                     )}

//                     <div className="mt-4">
//                       <label className="form-label fw-bold">Product Name</label>
//                       <input
//                         className={`form-control form-control-lg rounded-3 ${errors.name ? "is-invalid" : ""}`}
//                         value={form.name}
//                         onChange={(e) =>
//                           setForm({ ...form, name: e.target.value })
//                         }
//                       />
//                       {errors.name && (
//                         <div className="invalid-feedback d-block">
//                           {errors.name}
//                         </div>
//                       )}
//                     </div>

//                     <div className="mt-4">
//                       <label className="form-label fw-bold">Product Description</label>
//                       <textarea
//                         className="form-control rounded-3"
//                         rows={3}
//                         value={form.description ?? ""}
//                         onChange={(e) =>
//                           setForm({ ...form, description: e.target.value })
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* Right column */}
//                   <div className="col-md-6">
//                     <label className="form-label fw-bold">Unit Price</label>
//                     <div className="input-group input-group-lg">
//                       <span className="input-group-text rounded-start-3">LKR</span>
//                       <input
//                         type="number"
//                         step="0.01"
//                         min={0}
//                         className={`form-control rounded-end-3 ${errors.unitPrice ? "is-invalid" : ""}`}
//                         value={form.unitPrice}
//                         onChange={(e) =>
//                           setForm({
//                             ...form,
//                             unitPrice: Number(e.target.value),
//                           })
//                         }
//                       />
//                     </div>
//                     {errors.unitPrice && (
//                       <div className="invalid-feedback d-block">
//                         {errors.unitPrice}
//                       </div>
//                     )}

//                     <div className="mt-4">
//                       <label htmlFor="isActiveSwitch" className="rms-toggle">
//                         <input
//                           id="isActiveSwitch"
//                           type="checkbox"
//                           checked={!!form.isActive}
//                           onChange={(e) =>
//                             setForm({ ...form, isActive: e.target.checked })
//                           }
//                         />
//                         <span className="rms-toggle__track">
//                           <span className="rms-toggle__thumb" />
//                         </span>
//                         <span className={`rms-toggle__text ${form.isActive ? "on" : "off"}`}>
//                           {form.isActive ? "Active" : "Inactive"}
//                         </span>
//                       </label>

//                       <div className="form-text mt-1">
//                         Turning a product inactive hides it from active listings.
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             )},
//             modalRoot
//           </div>

//           {/* Footer */}
//           <div className="modal-footer">
//             <button
//               type="submit"
//               form="editProductForm"
//               className="btn btn-edit-primary"
//               disabled={isSaving}
//             >
//               {isSaving ? "Saving…" : "Save Changes"}
//             </button>
//             <button
//               type="button"
//               className="btn btn-outline-secondary btn-edit-outline"
//               onClick={onClose}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
     
//   );
// }















// // import { useEffect, useMemo, useState } from "react";
// // import { FiXCircle } from "react-icons/fi";
// // import {
// //   useGetProductByIdQuery,
// //   useGetCategoriesQuery,
// //   useUpdateProductMutation,
// // } from "../api";
// // import type { Category, ProductUpdateDto } from "../types";
// // import { useModalTransition } from "../../../reusablehooks/useModalTransition";
// // import "../../../reusablehooks/Modal.anim.css";

// // // If Bootstrap CSS is already imported globally (e.g., in main.tsx), you can remove this line:
// // import "bootstrap/dist/css/bootstrap.min.css";
// // import "../styles/EditProductModal.css";

// // type Props = {
// //   productId: number | null;   // id of the product to edit
// //   show: boolean;              // modal visible?
// //   onClose: () => void;        // close handler
// //   onUpdated?: () => void;     // refetch list after save
// // };

// // export default function EditProductModal({ productId, show, onClose, onUpdated }: Props) {
// //   const skip = !show || !productId;
// //   const { data: product, isLoading: loadingProduct, isError } =
// //     useGetProductByIdQuery(productId as number, { skip });
// //   const { data: cats, isLoading: catsLoading } =
// //     useGetCategoriesQuery(undefined, { skip });
// //   const [update, { isLoading: isSaving }] = useUpdateProductMutation();
// //   const { mounted, phase } = useModalTransition(show, 220);

// //   const categories = useMemo(
// //     () => (cats ?? []).filter((c: Category) => c.isActive),
// //     [cats]
// //   );

// //   const [form, setForm] = useState<ProductUpdateDto>({
// //     categoryId: 0,
// //     name: "",
// //     description: "",
// //     unitPrice: 0,
// //     isActive: true,
// //   });
// //   const [errors, setErrors] = useState<Record<string, string>>({});

// //   useEffect(() => {
// //     if (product && show) {
// //       setForm({
// //         categoryId: product.categoryId,
// //         name: product.name,
// //         description: product.description ?? "",
// //         unitPrice: product.unitPrice,
// //         isActive: product.isActive,
// //       });
// //       setErrors({});
// //     }
// //   }, [product, show]);

// //   function validate() {
// //     const e: Record<string, string> = {};
// //     if (!form.categoryId) e.categoryId = "Select a category";
// //     if (!form.name.trim()) e.name = "Name is required";
// //     if (
// //       form.unitPrice === null ||
// //       form.unitPrice === undefined ||
// //       Number(form.unitPrice) < 0
// //     )
// //       e.unitPrice = "Unit Price must be 0 or more";
// //     setErrors(e);
// //     return Object.keys(e).length === 0;
// //   }

// //   async function onSubmit(ev: React.FormEvent) {
// //     ev.preventDefault();
// //     if (!productId) return;
// //     if (!validate()) return;

// //     try {
// //       await update({
// //         id: productId,
// //         body: {
// //           categoryId: Number(form.categoryId),
// //           name: form.name.trim(),
// //           description: (form.description ?? "").trim(),
// //           unitPrice: Number(form.unitPrice),
// //           isActive: Boolean(form.isActive),
// //         },
// //       }).unwrap();
// //       onUpdated?.();
// //       onClose();
// //     } catch (err: any) {
// //       alert(err?.data ?? "Failed to update product");
// //       console.error(err);
// //     }
// //   }

// //   if (!mounted) return null;

// //   return (
// //     <div
// //       className="modal fade show rms-edit-modal"
// //       style={{ display: "block", background: "rgba(0,0,0,.6)" }}
// //     >
// //       <div className="modal-dialog modal-xl modal-dialog-centered">
// //         <div className="modal-content">
// //           {/* Header */}
// //           <div className="modal-header">
// //             <h3 className="fw-bold mb-0">
// //               Edit Product {productId ? `#${productId}` : ""}
// //             </h3>
// //             <button
// //               type="button"
// //               className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1"
// //               onClick={onClose}
// //             >
// //               <FiXCircle /> Close
// //             </button>
// //           </div>

// //           {/* Body */}
// //           <div className="modal-body">
// //             {isError && (
// //               <div className="alert alert-danger mb-3">
// //                 Failed to load product.
// //               </div>
// //             )}

// //             {loadingProduct ? (
// //               <div className="d-flex justify-content-center py-5">
// //                 <div className="spinner-border" role="status" />
// //               </div>
// //             ) : (
// //               <form onSubmit={onSubmit} id="editProductForm">
// //                 <div className="row g-4">
// //                   {/* Left column */}
// //                   <div className="col-md-6">
// //                     <label className="form-label fw-bold">Product Category</label>
// //                     <select
// //                       className={`form-select form-select-lg rounded-3 ${errors.categoryId ? "is-invalid" : ""
// //                         }`}
// //                       value={form.categoryId || 0}
// //                       onChange={(e) =>
// //                         setForm({ ...form, categoryId: Number(e.target.value) })
// //                       }
// //                       disabled={catsLoading}
// //                     >
// //                       {categories.length === 0 && (
// //                         <option value={0}>Loading…</option>
// //                       )}
// //                       {categories.map((c) => (
// //                         <option key={c.categoryId} value={c.categoryId}>
// //                           {c.name}
// //                         </option>
// //                       ))}
// //                     </select>
// //                     {errors.categoryId && (
// //                       <div className="invalid-feedback d-block">
// //                         {errors.categoryId}
// //                       </div>
// //                     )}

// //                     <div className="mt-4">
// //                       <label className="form-label fw-bold">Product Name</label>
// //                       <input
// //                         className={`form-control form-control-lg rounded-3 ${errors.name ? "is-invalid" : ""
// //                           }`}
// //                         value={form.name}
// //                         onChange={(e) =>
// //                           setForm({ ...form, name: e.target.value })
// //                         }
// //                       />
// //                       {errors.name && (
// //                         <div className="invalid-feedback d-block">
// //                           {errors.name}
// //                         </div>
// //                       )}
// //                     </div>

// //                     <div className="mt-4">
// //                       <label className="form-label fw-bold">Product Description</label>
// //                       <textarea
// //                         className="form-control rounded-3"
// //                         rows={3}
// //                         value={form.description ?? ""}
// //                         onChange={(e) =>
// //                           setForm({ ...form, description: e.target.value })
// //                         }
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* Right column */}
// //                   <div className="col-md-6">
// //                     <label className="form-label fw-bold">Unit Price</label>
// //                     <div className="input-group input-group-lg">
// //                       <span className="input-group-text rounded-start-3">LKR</span>
// //                       <input
// //                         type="number"
// //                         step="0.01"
// //                         min={0}
// //                         className={`form-control rounded-end-3 ${errors.unitPrice ? "is-invalid" : ""
// //                           }`}
// //                         value={form.unitPrice}
// //                         onChange={(e) =>
// //                           setForm({
// //                             ...form,
// //                             unitPrice: Number(e.target.value),
// //                           })
// //                         }
// //                       />
// //                     </div>
// //                     {errors.unitPrice && (
// //                       <div className="invalid-feedback d-block">
// //                         {errors.unitPrice}
// //                       </div>
// //                     )}

// //                     <div className="mt-4">
// //                       <label htmlFor="isActiveSwitch" className="rms-toggle">
// //                         <input
// //                           id="isActiveSwitch"
// //                           type="checkbox"
// //                           checked={!!form.isActive}
// //                           onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
// //                         />
// //                         <span className="rms-toggle__track">
// //                           <span className="rms-toggle__thumb" />
// //                         </span>
// //                         <span className={`rms-toggle__text ${form.isActive ? "on" : "off"}`}>
// //                           {form.isActive ? "Active" : "Inactive"}
// //                         </span>
// //                       </label>

// //                       <div className="form-text mt-1">
// //                         Turning a product inactive hides it from active listings.
// //                       </div>
// //                     </div>


// //                   </div>
// //                 </div>
// //               </form>
// //             )}
// //           </div>

// //           {/* Footer */}
// //           <div className="modal-footer">
// //             <button
// //               type="submit"
// //               form="editProductForm"
// //               className="btn btn-edit-primary"
// //               disabled={isSaving}
// //             >
// //               {isSaving ? "Saving…" : "Save Changes"}
// //             </button>
// //             <button
// //               type="button"
// //               className="btn btn-outline-secondary btn-edit-outline"
// //               onClick={onClose}
// //             >
// //               Cancel
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
