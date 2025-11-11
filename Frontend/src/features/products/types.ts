// Matches ProductListItem from your GET /api/products (active only)
export interface ProductListItem {
  productId: number;
  CategoryId: number;
  name: string;
  unitPrice: number;
  isActive: boolean;
  quantityOnHand: number; // from InventoryItem (0 if null)
}

// Matches ProductDetailsDto from your GET /api/products/{id}
export interface ProductDetailsDto {
  productId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  unitPrice: number;
  isActive: boolean;
  inventoryItemId?: number | null;
  quantityOnHand?: number | null;
  inventoryUpdatedAt?: string | null; // DateTime? returned as ISO string
}

// Matches POST /api/products request body (ProductCreateDto)
export interface ProductCreateDto {
  categoryId: number;
  name: string;
  description?: string | null;
  unitPrice: number; // must be >= 0 per controller
}

// Matches PUT /api/products/{id} request body (ProductUpdateDto)
export interface ProductUpdateDto {
  categoryId: number;
  name: string;
  description?: string | null;
  unitPrice: number;
  isActive: boolean;
}

export interface Category {
  categoryId: number;
  name: string;
  isActive: boolean;
}