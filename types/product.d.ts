export interface Product {
  id: number;
  name: string;
  brand?: string;
  category_id: number;
  category_name: string;
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
  official_urls?: {
    sephora?: string;
    ulta?: string;
    official?: string;
  };
}

export interface ProductWithCategory extends Product {
  category_name: string;
} 