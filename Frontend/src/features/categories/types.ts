export type CategoryListItem = {
  categoryId: number;
  name: string;
  isActive: boolean;
  parentCategoryId: number | null;
};

export type CategoryDetailsDto = {
  categoryId: number;
  name: string;
  isActive: boolean;
  parentCategoryId: number | null;
};

export type CategoryCreateDto = {
  name: string;
  parentCategoryId: number | null;
};

export type CategoryUpdateDto = {
  name: string;
  parentCategoryId: number | null;
};
