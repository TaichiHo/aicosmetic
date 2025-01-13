'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { RoutineWithProducts } from '@/types/routine';
import { UserProductWithDetails } from '@/types/userProduct';

interface RoutinesViewProps {
  initialRoutines: RoutineWithProducts[];
}

export default function RoutinesView({ initialRoutines }: RoutinesViewProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineWithProducts[]>(initialRoutines);
  const [isCreating, setIsCreating] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<UserProductWithDetails[]>([]);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    time_of_day: '',
    description: '',
    selectedProducts: [] as { id: number, notes: string }[]
  });

  const loadAvailableProducts = async () => {
    try {
      const response = await fetch('/api/get-user-products');
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const products = await response.json();
      console.log("products", products);
      setAvailableProducts(products.data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  useEffect(() => {
    if (isCreating) {
      loadAvailableProducts();
    }
  }, [isCreating]);

  const handleCreateRoutine = async () => {
    try {
      // First create the routine
      const routineResponse = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRoutine.name,
          time_of_day: newRoutine.time_of_day,
          description: newRoutine.description
        })
      });

      if (!routineResponse.ok) {
        throw new Error('Failed to create routine');
      }

      const routine = await routineResponse.json();

      // Then add each product to the routine
      const products = [];
      for (let i = 0; i < newRoutine.selectedProducts.length; i++) {
        const product = newRoutine.selectedProducts[i];
        const productResponse = await fetch(`/api/routines/${routine.id}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_product_id: product.id,
            step_order: i + 1,
            notes: product.notes
          })
        });
        const addedProduct = await productResponse.json();
        products.push(addedProduct);
      }

      // Add the products to the routine object
      routine.products = products;
      setRoutines([routine, ...routines]);
      setIsCreating(false);
      setNewRoutine({ 
        name: '', 
        time_of_day: '', 
        description: '', 
        selectedProducts: [] 
      });
      toast.success('Routine created successfully');
      router.refresh();
    } catch (error) {
      console.error('Error creating routine:', error);
      toast.error('Failed to create routine');
    }
  };

  const handleAddProduct = () => {
    setNewRoutine({
      ...newRoutine,
      selectedProducts: [...newRoutine.selectedProducts, { id: 0, notes: '' }]
    });
  };

  const handleRemoveProduct = (index: number) => {
    setNewRoutine({
      ...newRoutine,
      selectedProducts: newRoutine.selectedProducts.filter((_, i) => i !== index)
    });
  };

  const handleProductChange = (index: number, productId: number, notes: string) => {
    const updatedProducts = [...newRoutine.selectedProducts];
    updatedProducts[index] = { id: productId, notes };
    setNewRoutine({
      ...newRoutine,
      selectedProducts: updatedProducts
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>Create New Routine</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Beauty Routine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                  placeholder="Morning Glow Routine"
                />
              </div>
              <div>
                <Label htmlFor="time">Time of Day</Label>
                <Select
                  value={newRoutine.time_of_day}
                  onValueChange={(value) => setNewRoutine({ ...newRoutine, time_of_day: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time of day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRoutine.description}
                  onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                  placeholder="A gentle routine for glowing skin..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Products</Label>
                  <Button onClick={handleAddProduct} type="button" variant="outline" size="sm">
                    Add Product
                  </Button>
                </div>
                
                {newRoutine.selectedProducts.map((product, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label>Step {index + 1}</Label>
                      <Button 
                        onClick={() => handleRemoveProduct(index)}
                        variant="destructive"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                    <select
                      value={product.id}
                      onChange={(e) => handleProductChange(index, Number(e.target.value), product.notes)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value={0}>Select a product...</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product.brand} - {p.product.name}
                        </option>
                      ))}
                    </select>
                    <Textarea
                      value={product.notes}
                      onChange={(e) => handleProductChange(index, product.id, e.target.value)}
                      placeholder="Add notes about using this product..."
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleCreateRoutine} 
                className="w-full"
                disabled={!newRoutine.name || !newRoutine.time_of_day}
              >
                Create Routine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines.map((routine) => (
          <Card key={routine.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/routines/${routine.id}`)}>
            <CardHeader>
              <CardTitle>{routine.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">
                {routine.time_of_day.charAt(0).toUpperCase() + routine.time_of_day.slice(1)}
              </p>
              {routine.description && (
                <p className="text-sm text-gray-700 mb-4">{routine.description}</p>
              )}
              <p className="text-sm font-medium">
                {routine.products.length} {routine.products.length === 1 ? 'product' : 'products'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 