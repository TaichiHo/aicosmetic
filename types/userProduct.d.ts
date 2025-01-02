import { ProductWithCategory } from "./product";

export interface UserProduct {
  id: number;
  clerk_id: string;
  product_id: number;
  purchase_date?: Date;
  expiry_date?: Date;
  opened_date?: Date;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_location?: string;
  usage_status: 'new' | 'in-use' | 'finished';
  usage_percentage: number;
  notes?: string;
  created_at: Date;
  uuid: string;
}

export interface UserProductWithDetails extends UserProduct {
  product: ProductWithCategory;
} 