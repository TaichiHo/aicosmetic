'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { RoutineWithProducts } from '@/types/routine';

interface RoutineDetailViewProps {
  routine: RoutineWithProducts;
}

export default function RoutineDetailView({ routine: initialRoutine }: RoutineDetailViewProps) {
  const router = useRouter();
  const [routine, setRoutine] = useState(initialRoutine);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productNotes, setProductNotes] = useState('');

  const loadAvailableProducts = async () => {
    try {
      const response = await fetch('/api/user-products');
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const products = await response.json();
      setAvailableProducts(products.data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    try {
      const response = await fetch(`/api/routines/${routine.id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_product_id: parseInt(selectedProduct),
          step_order: routine.products.length + 1,
          notes: productNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const newProduct = await response.json();
      setRoutine({
        ...routine,
        products: [...routine.products, newProduct]
      });
      setIsAddingProduct(false);
      setSelectedProduct('');
      setProductNotes('');
      toast.success('Product added successfully');
      router.refresh();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleRemoveProduct = async (routineProductId: number) => {
    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products?routineProductId=${routineProductId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove product');
      }

      setRoutine({
        ...routine,
        products: routine.products.filter((p) => p.id !== routineProductId)
      });
      toast.success('Product removed successfully');
      router.refresh();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{routine.name}</h1>
          <p className="text-gray-500 mt-2">
            {routine.time_of_day.charAt(0).toUpperCase() + routine.time_of_day.slice(1)} Routine
          </p>
          {routine.description && (
            <p className="text-gray-700 mt-4">{routine.description}</p>
          )}
        </div>
        <Dialog open={isAddingProduct} onOpenChange={(open) => {
          setIsAddingProduct(open);
          if (open) {
            loadAvailableProducts();
          }
        }}>
          <DialogTrigger asChild>
            <Button>Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product to Routine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Select Product</Label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select a product...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product.brand} - {product.product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="Add any notes about using this product..."
                />
              </div>
              <Button onClick={handleAddProduct} className="w-full">
                Add to Routine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {routine.products.map((routineProduct, index) => (
          <Card key={routineProduct.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16">
                  {routineProduct.user_product?.product.image_url ? (
                    <Image
                      src={routineProduct.user_product.product.image_url}
                      alt={routineProduct.user_product.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">
                    {routineProduct.user_product?.product.brand} -{' '}
                    {routineProduct.user_product?.product.name}
                  </h3>
                  {routineProduct.notes && (
                    <p className="text-sm text-gray-500 mt-1">{routineProduct.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Step {index + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveProduct(routineProduct.id)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {routine.products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products in this routine yet.</p>
            <p className="text-gray-500 mt-2">Click "Add Product" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
} 