export interface Product {
  id: number;
  name: string;
  brand?: string;
  category_id: number;
  description?: string;
  image_url?: string;
  barcode?: string;
  size_value?: number;
  size_unit?: string;
  standard_size?: string;
  retail_price?: number;
  currency?: string;
  created_at: Date;
  uuid: string;
}

export interface ProductWithCategory extends Product {
  category_name: string;
} 