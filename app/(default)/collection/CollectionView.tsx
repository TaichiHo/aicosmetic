'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserProductWithDetails } from '@/types/userProduct';
import { toast } from 'sonner';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import EditProductDialog from '@/components/products/EditProductDialog';

interface CollectionViewProps {
  initialProducts: UserProductWithDetails[];
}

type SortOption = 'newest' | 'oldest' | 'name';

export default function CollectionView({ initialProducts }: CollectionViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState<UserProductWithDetails[]>(initialProducts);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<UserProductWithDetails | null>(null);

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.product.category_name));
    return ['all', ...Array.from(uniqueCategories)];
  }, [products]);

  const handleDelete = async (userProductId: number) => {
    if (!confirm('Are you sure you want to delete this product from your collection?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-user-product', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProductId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(p => p.id !== userProductId));
      toast.success('Product deleted from collection');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.product.category_name === categoryFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.product.name.toLowerCase().includes(query) ||
        p.product.brand?.toLowerCase().includes(query) ||
        p.product.category_name.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.product.name.localeCompare(b.product.name);
        default:
          return 0;
      }
    });

    return result;
  }, [products, sortBy, categoryFilter, searchQuery]);

  const handleProductUpdated = (updatedProduct: UserProductWithDetails) => {
    setProducts(products.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Collection</h1>
        
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full md:w-auto"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No products found</p>
          <button 
            onClick={() => router.push('/products')}
            className="text-primary hover:underline"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedProducts.map((userProduct) => (
            <div
              key={userProduct.id}
              className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Dropdown Menu */}
              <div className="absolute top-2 right-2 z-10">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdown = e.currentTarget.nextElementSibling;
                      dropdown?.classList.toggle('hidden');
                    }}
                    className="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(userProduct.id);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete from collection
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Card Content (clickable) */}
              <div onClick={() => router.push(`/user-products/${userProduct.id}`)}>
                <div className="aspect-square relative">
                  {userProduct.product.image_url ? (
                    <Image
                      src={userProduct.product.image_url}
                      alt={userProduct.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : userProduct.user_image_url ? (
                    <Image
                      src={userProduct.user_image_url}
                      alt={userProduct.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">
                    {userProduct.product.brand} - {userProduct.product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {userProduct.product.category_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Added {formatDate(userProduct.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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