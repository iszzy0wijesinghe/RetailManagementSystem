// src/features/discounts/types.ts

// Single source-of-truth enums (as const arrays)
export const DISCOUNT_TYPES = ["Percent", "Amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ["Global", "Category", "Product", "Coupon"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

// ---- List item (GET /discounts)
export type DiscountListItem = {
  discountId: number;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  isActive: boolean;
  priority: number;
  // ISO strings or null from server
  startsAt: string | null;
  endsAt: string | null;
  categoriesCount: number;
  productsCount: number;
  couponsCount: number;
};

// ---- Details (GET /discounts/{id})
export type DiscountDetailsDto = {
  discountId: number;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  isActive: boolean;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  minBasketSubtotal: number | null;
  maxTotalDiscount: number | null;
  categoryIds: number[];
  productIds: number[];
};

// ---- Create / Update payloads
export type DiscountCreateDto = {
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  isStackable: boolean;
  priority: number;
  // send ISO strings or null/omit
  startsAt?: string | null;
  endsAt?: string | null;
  minBasketSubtotal?: number | null;
  maxTotalDiscount?: number | null;
};

export type DiscountUpdateDto = DiscountCreateDto;

// ---- Link payloads
export type DiscountLinkCategoryDto = { categoryId: number };
export type DiscountLinkProductDto = { productId: number };

// ---------- Optional: UI-friendly form model ----------
// If your form uses strings for inputs (esp. numbers/dates), this helps
export type DiscountFormValues = {
  name: string;
  type: DiscountType;
  value: string;              // as string in form input
  scope: DiscountScope;
  isStackable: boolean;
  priority: string;           // as string in form input
  startsAt?: string | null;   // "YYYY-MM-DDTHH:mm" or ISO string
  endsAt?: string | null;
  minBasketSubtotal?: string; // string in input
  maxTotalDiscount?: string;  // string in input
  categoryIds: number[];      // for edit UX (optional)
  productIds: number[];       // for edit UX (optional)
};

// Convert form -> API
export function toCreateDto(f: DiscountFormValues): DiscountCreateDto {
  const n = (s?: string | null) =>
    s == null || s === "" ? undefined : Number(s);
  const dt = (s?: string | null) =>
    s == null || s === "" ? undefined : s; // keep as string; ensure ISO upstream if needed

  return {
    name: f.name.trim(),
    type: f.type,
    value: Number(f.value || 0),
    scope: f.scope,
    isStackable: !!f.isStackable,
    priority: Number(f.priority || 0),
    startsAt: dt(f.startsAt) ?? null,
    endsAt: dt(f.endsAt) ?? null,
    minBasketSubtotal: n(f.minBasketSubtotal) ?? null,
    maxTotalDiscount: n(f.maxTotalDiscount) ?? null,
  };
}

// Convert details -> form (for edit)
export function detailsToForm(d: DiscountDetailsDto): DiscountFormValues {
  return {
    name: d.name,
    type: d.type,
    value: String(d.value),
    scope: d.scope,
    isStackable: false, // API doesn’t return it in your sample; set after fetch if available
    priority: String(d.priority),
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    minBasketSubtotal: d.minBasketSubtotal == null ? "" : String(d.minBasketSubtotal),
    maxTotalDiscount: d.maxTotalDiscount == null ? "" : String(d.maxTotalDiscount),
    categoryIds: d.categoryIds ?? [],
    productIds: d.productIds ?? [],
  };
}
