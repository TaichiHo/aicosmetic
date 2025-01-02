export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface CategoryWithProductCount extends Category {
  product_count: number;
} 