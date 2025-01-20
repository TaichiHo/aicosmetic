'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserProductWithDetails } from '@/types/userProduct';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Pencil } from 'lucide-react';
import EditProductDialog from '@/components/products/EditProductDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

interface ProductDetailProps {
  userProduct: UserProductWithDetails;
}

export default function ProductDetail({ userProduct: initialUserProduct }: ProductDetailProps) {
  const router = useRouter();
  const [userProduct, setUserProduct] = useState<UserProductWithDetails>(initialUserProduct);
  const [editingProduct, setEditingProduct] = useState<UserProductWithDetails | null>(null);

  // Reset state when initialUserProduct changes
  useEffect(() => {
    setUserProduct(initialUserProduct);
  }, [initialUserProduct]);

  // Add defensive check for product
  if (!userProduct?.product) {
    console.error("Product data is missing");
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">Product data is missing or invalid.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/collection')}
          >
            Return to Collection
          </Button>
        </div>
      </div>
    );
  }

  const handleProductUpdated = useCallback(async (updatedProduct: UserProductWithDetails) => {
    try {
      setEditingProduct(null);
      setUserProduct(updatedProduct);
      
      // Show success message
      toast.success('Product updated successfully');
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/user-products/${userProduct.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast.success('Product deleted successfully');
      router.push('/collection');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  }, [userProduct.id, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images Section */}
        <div className="space-y-4">
          {/* Main Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            {userProduct.product?.image_url ? (
              <Image
                src={userProduct.product.image_url}
                alt={userProduct.product?.name || 'Product image'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* User Uploaded Image */}
          {userProduct.user_image_url && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Your Photo</h3>
              <div className="relative aspect-square w-32 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={userProduct.user_image_url}
                  alt="Your photo of this product"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              {userProduct.product?.brand && (
                <h2 className="text-xl text-gray-600">{userProduct.product.brand}</h2>
              )}
              <h1 className="text-3xl font-bold">{userProduct.product?.name || 'Unnamed Product'}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingProduct(userProduct)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Product
              </Button>
              
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="text-red-600"
                  >
                    Delete Product
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-4">
            {userProduct.product?.description && (
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-600">{userProduct.product.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {userProduct.product?.category_name && (
                <div>
                  <h3 className="text-lg font-semibold">Category</h3>
                  <p className="text-gray-600">{userProduct.product.category_name}</p>
                </div>
              )}

              {userProduct.product?.size_value && (
                <div>
                  <h3 className="text-lg font-semibold">Size</h3>
                  <p className="text-gray-600">
                    {userProduct.product.size_value} {userProduct.product.size_unit}
                  </p>
                </div>
              )}

              {userProduct.product?.retail_price && (
                <div>
                  <h3 className="text-lg font-semibold">Retail Price</h3>
                  <p className="text-gray-600">
                    {userProduct.product.retail_price} {userProduct.product.currency}
                  </p>
                </div>
              )}

              {userProduct.product?.barcode && (
                <div>
                  <h3 className="text-lg font-semibold">Barcode</h3>
                  <p className="text-gray-600">{userProduct.product.barcode}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Your Product Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Added on {formatDate(userProduct.created_at)}
                </p>
                {userProduct.purchase_date && (
                  <p className="text-sm text-gray-600">
                    Purchased on {formatDate(userProduct.purchase_date)}
                  </p>
                )}
                {userProduct.opened_date && (
                  <p className="text-sm text-gray-600">
                    Opened on {formatDate(userProduct.opened_date)}
                  </p>
                )}
                {userProduct.expiry_date && (
                  <p className="text-sm text-gray-600">
                    Expires on {formatDate(userProduct.expiry_date)}
                  </p>
                )}
                {userProduct.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                    <p className="text-sm text-gray-600 mt-1">{userProduct.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingProduct(null);
            }
          }}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
} 