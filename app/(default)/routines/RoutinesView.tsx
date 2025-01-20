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
import { RoutineWithSteps, UserStep } from '@/types/routine';
import { UserProductWithDetails } from '@/types/userProduct';
import ManageStepsDialog from '@/components/steps/ManageStepsDialog';
import { MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';

interface RoutineProduct {
  user_product_id: number;
}

interface RoutineStep {
  name: string;
  products: RoutineProduct[];
}

interface NewRoutine {
  name: string;
  description: string;
  steps: RoutineStep[];
}

interface RoutinesViewProps {
  initialRoutines: RoutineWithSteps[];
}

export default function RoutinesView({ initialRoutines }: RoutinesViewProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineWithSteps[]>(initialRoutines);
  const [isCreating, setIsCreating] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<UserProductWithDetails[]>([]);
  const [userSteps, setUserSteps] = useState<UserStep[]>([]);
  const [customStepName, setCustomStepName] = useState('');
  const [newRoutine, setNewRoutine] = useState<NewRoutine>({
    name: '',
    description: '',
    steps: [
      { name: 'Cleansing', products: [] },
      { name: 'Toning', products: [] },
      { name: 'Moisturizing', products: [] }
    ]
  });
  const [isManagingSteps, setIsManagingSteps] = useState(false);

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

  const loadUserSteps = async () => {
    try {
      const response = await fetch('/api/user-steps');
      if (!response.ok) {
        throw new Error('Failed to load steps');
      }
      const steps = await response.json();
      setUserSteps(steps);
    } catch (error) {
      console.error('Error loading steps:', error);
      toast.error('Failed to load steps');
    }
  };

  useEffect(() => {
    if (isCreating) {
      loadAvailableProducts();
      loadUserSteps();
    }
  }, [isCreating]);

  const handleCreateRoutine = async () => {
    try {
      // Transform steps data for API
      const selectedProducts = newRoutine.steps.flatMap((step, stepIndex) => 
        step.products.map((product, productIndex) => ({
          ...product,
          step_name: step.name,
          order: stepIndex + 1,
          notes: ''
        }))
      );

      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRoutine.name,
          description: newRoutine.description,
          selectedProducts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create routine');
      }

      const routine = await response.json();
      setRoutines([routine, ...routines]);
      setIsCreating(false);
      setNewRoutine({ 
        name: '', 
        description: '', 
        steps: [
          { name: 'Cleansing', products: [] },
          { name: 'Toning', products: [] },
          { name: 'Moisturizing', products: [] }
        ]
      });
      toast.success('Routine created successfully');
      router.refresh();
    } catch (error) {
      console.error('Error creating routine:', error);
      toast.error('Failed to create routine');
    }
  };

  const handleAddProduct = (stepIndex: number) => {
    setNewRoutine(prev => {
      const updatedSteps = prev.steps.map((step, index) => {
        if (index === stepIndex) {
          return {
            ...step,
            products: [...step.products, { user_product_id: 0 }]
          };
        }
        return step;
      });
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleRemoveProduct = (stepIndex: number, productIndex: number) => {
    setNewRoutine(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex].products.splice(productIndex, 1);
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleProductChange = (stepIndex: number, productIndex: number, productId: number) => {
    setNewRoutine(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex].products[productIndex] = { user_product_id: productId };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleAddCustomStep = () => {
    setNewRoutine(prev => ({
      ...prev,
      steps: [...prev.steps, { name: customStepName, products: [] }]
    }));
    setCustomStepName('');
  };

  const handleRemoveStep = (stepIndex: number) => {
    if (stepIndex < 3) {
      toast.error('Cannot remove default steps');
      return;
    }
    setNewRoutine(prev => ({
      ...prev,
      steps: prev.steps.filter((_, index) => index !== stepIndex)
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Routines</h1>
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

              <div className="space-y-6">
                {newRoutine.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{step.name}</h3>
                        {stepIndex >= 3 && (
                          <Button
                            onClick={() => handleRemoveStep(stepIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleAddProduct(stepIndex)} 
                        variant="outline" 
                        size="sm"
                      >
                        Add Product
                      </Button>
                    </div>

                    {step.products.map((product, productIndex) => (
                      <div key={productIndex} className="space-y-2 pl-4 border-l-2">
                        <div className="flex justify-between items-center">
                          <Label>Product {productIndex + 1}</Label>
                          <Button
                            onClick={() => handleRemoveProduct(stepIndex, productIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label>Product</Label>
                            <select
                              value={product.user_product_id}
                              onChange={(e) => handleProductChange(stepIndex, productIndex, Number(e.target.value))}
                              className="w-full border rounded-md p-2"
                            >
                              <option value={0}>Select a product...</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.product.brand} - {p.product.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {step.products.length === 0 && (
                      <p className="text-sm text-gray-500 pl-4">No products added to this step yet.</p>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom step name..."
                    value={customStepName}
                    onChange={(e) => setCustomStepName(e.target.value)}
                  />
                  <Button
                    onClick={handleAddCustomStep}
                    disabled={!customStepName.trim()}
                    variant="outline"
                  >
                    Add Custom Step
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleCreateRoutine} 
                className="w-full"
                disabled={!newRoutine.name || !newRoutine.steps.some(step => step.products.some(product => product.user_product_id !== 0))}
              >
                Create Routine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => setIsManagingSteps(true)}>
          Manage Steps
        </Button>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No routines yet</p>
          <Button onClick={() => setIsCreating(true)}>Create Your First Routine</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {routines.map((routine) => {
            // Get the first product image from the first step to use as cover
            const firstProduct = routine.steps[0]?.products[0]?.user_product;
            const coverImage = firstProduct?.user_image_url || firstProduct?.product.image_url;

            return (
              <Card 
                key={routine.id}
                className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/routines/${routine.id}`)}
              >
                {/* Card Cover Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={routine.name}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-gray-400">No cover image</span>
                    </div>
                  )}
                  {/* Actions Menu */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/routines/${routine.id}`);
                        }}>
                          Edit Routine
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Are you sure you want to delete this routine?')) return;
                            
                            try {
                              const response = await fetch(`/api/routines/${routine.id}`, {
                                method: 'DELETE'
                              });
                              
                              if (!response.ok) throw new Error('Failed to delete routine');
                              
                              setRoutines(routines.filter(r => r.id !== routine.id));
                              toast.success('Routine deleted successfully');
                              router.refresh();
                            } catch (error) {
                              console.error('Error deleting routine:', error);
                              toast.error('Failed to delete routine');
                            }
                          }}
                        >
                          Delete Routine
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-1">{routine.name}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  {routine.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {routine.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{routine.steps.length} steps</span>
                    <span>{routine.steps.reduce((total, step) => total + step.products.length, 0)} products</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ManageStepsDialog
        open={isManagingSteps}
        onOpenChange={setIsManagingSteps}
      />
    </div>
  );
} 