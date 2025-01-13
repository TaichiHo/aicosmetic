export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  image_type: 'main' | 'thumbnail';
  source_url?: string;
  source?: 'sephora' | 'ulta' | 'user' | 'other';
  created_at: Date;
  uuid: string;
} 