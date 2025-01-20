'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProductWithCategory } from '@/types/product';
import { UserProductWithDetails } from '@/types/userProduct';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import EditProductDialog from '@/components/products/EditProductDialog';

interface ProductDetailProps {
  product: ProductWithCategory;
  userProducts: UserProductWithDetails[];
}

export default function ProductDetail({ product, userProducts: initialUserProducts }: ProductDetailProps) {
  const [editingProduct, setEditingProduct] = useState<UserProductWithDetails | null>(null);
  const [userProducts, setUserProducts] = useState<UserProductWithDetails[]>(initialUserProducts);

  const handleProductUpdated = (updatedProduct: UserProductWithDetails) => {
    setUserProducts(userProducts.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images Section */}
        <div className="space-y-4">
          {/* Main Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
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
          {userProducts.length > 0 && userProducts[0].user_image_url && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Your Photo</h3>
              <div className="relative aspect-square w-32 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={userProducts[0].user_image_url}
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
          <div>
            {product.brand && (
              <h2 className="text-xl text-gray-600">{product.brand}</h2>
            )}
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="space-y-4">
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Category</h3>
                <p className="text-gray-600">{product.category_name}</p>
              </div>

              {product.size_value && (
                <div>
                  <h3 className="text-lg font-semibold">Size</h3>
                  <p className="text-gray-600">
                    {product.size_value} {product.size_unit}
                  </p>
                </div>
              )}

              {product.retail_price && (
                <div>
                  <h3 className="text-lg font-semibold">Retail Price</h3>
                  <p className="text-gray-600">
                    {product.retail_price} {product.currency}
                  </p>
                </div>
              )}

              {product.barcode && (
                <div>
                  <h3 className="text-lg font-semibold">Barcode</h3>
                  <p className="text-gray-600">{product.barcode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add to Collection Button */}
          <button className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors">
            Add to My Collection
          </button>

          {/* User's Collection */}
          {userProducts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Your Collection</h2>
              <div className="space-y-4">
                {userProducts.map((userProduct) => (
                  <div
                    key={userProduct.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          Added {formatDate(userProduct.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdown = e.currentTarget.nextElementSibling;
                              dropdown?.classList.toggle('hidden');
                            }}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <div className="hidden absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(userProduct);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Edit product
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      {userProduct.purchase_date && (
                        <p>Purchased: {formatDate(userProduct.purchase_date)}</p>
                      )}
                      {userProduct.opened_date && (
                        <p>Opened: {formatDate(userProduct.opened_date)}</p>
                      )}
                      {userProduct.expiry_date && (
                        <p>Expires: {formatDate(userProduct.expiry_date)}</p>
                      )}
                    </div>
                    {userProduct.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        Notes: {userProduct.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => {
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