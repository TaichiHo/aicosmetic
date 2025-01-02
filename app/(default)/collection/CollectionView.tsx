'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserProductWithDetails } from '@/types/userProduct';

interface CollectionViewProps {
  initialProducts: UserProductWithDetails[];
}

type SortOption = 'newest' | 'oldest' | 'name' | 'usage';
type FilterOption = 'all' | 'new' | 'in-use' | 'finished';

export default function CollectionView({ initialProducts }: CollectionViewProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by status
    if (filterBy !== 'all') {
      result = result.filter(p => p.usage_status === filterBy);
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
        case 'usage':
          return b.usage_percentage - a.usage_percentage;
        default:
          return 0;
      }
    });

    return result;
  }, [initialProducts, sortBy, filterBy, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Collection</h1>
        
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
              <option value="usage">Usage</option>
            </select>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in-use">In Use</option>
              <option value="finished">Finished</option>
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
              className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/products/${userProduct.product.id}`)}
            >
              <div className="aspect-square relative">
                {userProduct.product.image_url ? (
                  <Image
                    src={userProduct.product.image_url}
                    alt={userProduct.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {userProduct.product.brand && (
                  <p className="text-sm text-gray-500">{userProduct.product.brand}</p>
                )}
                <h3 className="font-medium text-lg">{userProduct.product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{userProduct.product.category_name}</p>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm px-2 py-1 rounded ${
                    userProduct.usage_status === 'new' ? 'bg-green-100 text-green-700' :
                    userProduct.usage_status === 'in-use' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {userProduct.usage_status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {userProduct.usage_percentage}% used
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 