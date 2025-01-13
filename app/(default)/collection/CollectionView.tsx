'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserProductWithDetails } from '@/types/userProduct';
import { toast } from 'sonner';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

interface CollectionViewProps {
  initialProducts: UserProductWithDetails[];
}

type SortOption = 'newest' | 'oldest' | 'name' | 'usage';
type FilterOption = 'all' | 'new' | 'in-use' | 'finished';

export default function CollectionView({ initialProducts }: CollectionViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState<UserProductWithDetails[]>(initialProducts);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [usageHistories, setUsageHistories] = useState<{ [key: number]: { usage_date: Date, usage_percentage: number }[] }>({});

  useEffect(() => {
    const fetchUsageHistories = async () => {
      const histories: { [key: number]: { usage_date: Date, usage_percentage: number }[] } = {};
      for (const product of products) {
        try {
          const response = await fetch(`/api/get-usage-history?userProductId=${product.id}`);
          const data = await response.json();
          if (data.success) {
            histories[product.id] = data.usageHistory;
          }
        } catch (error) {
          console.error('Failed to fetch usage history:', error);
        }
      }
      setUsageHistories(histories);
    };

    fetchUsageHistories();
  }, [products]);

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

    // Filter by status
    if (filterBy !== 'all') {
      result = result.filter(p => p.usage_status === filterBy);
    }

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
        case 'usage':
          return b.usage_percentage - a.usage_percentage;
        default:
          return 0;
      }
    });

    return result;
  }, [products, sortBy, filterBy, categoryFilter, searchQuery]);

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
              <div onClick={() => router.push(`/products/${userProduct.product.id}`)}>
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
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  {userProduct.user_image_url && userProduct.product.image_url && (
                    <div className="absolute bottom-2 right-2">
                      <div className="bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-100">
                        <Image
                          src={userProduct.user_image_url}
                          alt="User uploaded image"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
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

                  {/* Usage History */}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">Usage History</h3>
                    <ul className="list-disc pl-5">
                      {usageHistories[userProduct.id]?.map((entry, index) => (
                        <li key={index} className="text-xs text-gray-600">
                          {formatDate(entry.usage_date)}: {entry.usage_percentage}%
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 