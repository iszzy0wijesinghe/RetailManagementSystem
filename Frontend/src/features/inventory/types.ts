// src/features/inventory/types.ts
export type InventoryDetailsDto = {
  inventoryItemId: number;
  productId: number;
  quantityOnHand: number;
  updatedAt: string; // ISO
};

export type AdjustStockDto = {
  productId: number;
  quantityDelta: number; // +in / -out
  note?: string | null;
};
