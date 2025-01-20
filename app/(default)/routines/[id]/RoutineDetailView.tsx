'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { RoutineWithSteps, UserStep } from '@/types/routine';
import { UserProductWithDetails } from '@/types/userProduct';
import { Pencil, GripVertical, MoreVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditProductDialog from '@/components/products/EditProductDialog';

interface RoutineDetailViewProps {
  routine: RoutineWithSteps;
}

interface SortableStepProps {
  step: RoutineWithSteps['steps'][0];
  onRemoveProduct: (stepId: number, productId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onEditStep: (stepId: number, newName: string) => void;
  onEditProduct: (product: UserProductWithDetails) => void;
}

function SortableStep({ step, onRemoveProduct, onDeleteStep, onEditStep, onEditProduct }: SortableStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(step.user_step.name);
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleEditSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newName.trim() && newName !== step.user_step.name) {
      onEditStep(step.id, newName.trim());
    }
    setIsEditing(false);
  };

  const handleEditProduct = (e: React.MouseEvent, product: UserProductWithDetails) => {
    e.preventDefault();
    e.stopPropagation();
    onEditProduct(product);
  };

  const handleRemoveProduct = (e: React.MouseEvent, stepId: number, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    onRemoveProduct(stepId, productId);
  };

  return (
    <Card className="mb-4" style={style}>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} ref={setNodeRef} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-gray-500" />
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-48"
                />
                <Button size="sm" onClick={handleEditSubmit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(false);
                }}>Cancel</Button>
              </div>
            ) : (
              <CardTitle>{step.user_step.name}</CardTitle>
            )}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}>
                Edit Step Name
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteStep(step.id);
                }}
                className="text-red-600"
              >
                Delete Step
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {step.products.map((product) => (
          <div key={product.id} className="mb-4 last:mb-0">
            {product.user_product && (
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-start gap-4 cursor-pointer hover:opacity-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.user_product) {
                      router.push(`/user-products/${product.user_product.id}`);
                    }
                  }}
                >
                  {product.user_product.user_image_url ? (
                    <div className="relative h-16 w-16">
                      <Image
                        src={product.user_product.user_image_url}
                        alt={product.user_product.product.name}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : product.user_product.product.image_url ? (
                    <div className="relative h-16 w-16">
                      <Image
                        src={product.user_product.product.image_url}
                        alt={product.user_product.product.name}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : null}
                  <div>
                    <h4 className="font-medium">
                      {product.user_product.product.brand} - {product.user_product.product.name}
                    </h4>
                    {product.notes && (
                      <p className="text-sm text-gray-500 mt-1">{product.notes}</p>
                    )}
                  </div>
                </div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleRemoveProduct(e, step.id, product.id)}
                      className="text-red-600"
                    >
                      Remove from Routine
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function RoutineDetailView({ routine: initialRoutine }: RoutineDetailViewProps) {
  const router = useRouter();
  const [routine, setRoutine] = useState<RoutineWithSteps>(initialRoutine);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: routine.name,
    description: routine.description || ''
  });
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productNotes, setProductNotes] = useState('');
  const [stepName, setStepName] = useState('');
  const [selectedStep, setSelectedStep] = useState<'new' | number>('new');
  const [editingProduct, setEditingProduct] = useState<UserProductWithDetails | null>(null);
  const [userSteps, setUserSteps] = useState<UserStep[]>([]);
  const [customStepName, setCustomStepName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`/api/routines/${routine.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update routine');
      }

      const updatedRoutine = await response.json();
      setRoutine({
        ...routine,
        name: editForm.name,
        description: editForm.description
      });
      setIsEditing(false);
      toast.success('Routine updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating routine:', error);
      toast.error('Failed to update routine');
    }
  };

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
    if (isAddingProduct) {
      loadAvailableProducts();
      loadUserSteps();
    }
  }, [isAddingProduct]);

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (!stepName) {
      toast.error('Please select a step');
      return;
    }

    if (stepName === 'custom' && !customStepName) {
      toast.error('Please enter a step name');
      return;
    }

    try {
      // Find the maximum step order in the current routine
      const maxStepOrder = routine.steps.reduce((max, step) => 
        Math.max(max, step.step_order), 0);

      const response = await fetch(`/api/routines/${routine.id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_product_id: parseInt(selectedProduct),
          step_order: maxStepOrder + 1,
          step_name: stepName === 'custom' ? customStepName : stepName,
          notes: productNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const newProduct = await response.json();
      
      setRoutine(prevRoutine => ({
        ...prevRoutine,
        steps: [...prevRoutine.steps, { 
          id: newProduct.routine_step_id,
          routine_id: routine.id,
          step_order: maxStepOrder + 1,
          user_step_id: newProduct.user_step_id,
          user_step: {
            id: newProduct.user_step_id,
            clerk_id: routine.clerk_id,
            name: stepName === 'custom' ? customStepName : stepName,
            created_at: new Date(),
            uuid: ''
          },
          created_at: new Date(),
          uuid: '',
          products: [newProduct]
        }]
      }));

      setIsAddingProduct(false);
      setSelectedProduct('');
      setStepName('');
      setCustomStepName('');
      setProductNotes('');
      toast.success('Product added successfully');
      router.refresh();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleRemoveProduct = async (stepId: number, productId: number) => {
    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products?productId=${productId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove product');
      }

      setRoutine({
        ...routine,
        steps: routine.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              products: step.products.filter(p => p.id !== productId)
            };
          }
          return step;
        }).filter(step => step.products.length > 0)
      });
      toast.success('Product removed successfully');
      router.refresh();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = routine.steps.findIndex(step => step.id === active.id);
    const newIndex = routine.steps.findIndex(step => step.id === over.id);

    const newSteps = arrayMove(routine.steps, oldIndex, newIndex);
    
    // Update step orders
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      step_order: index + 1
    }));

    // Optimistically update UI
    setRoutine({
      ...routine,
      steps: updatedSteps
    });

    // Update on server
    try {
      const response = await fetch(`/api/routines/${routine.id}/steps/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          steps: updatedSteps.map(step => ({
            id: step.id,
            step_order: step.step_order
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update step order');
      }

      toast.success('Step order updated');
    } catch (error) {
      console.error('Error updating step order:', error);
      toast.error('Failed to update step order');
      // Revert to original order
      setRoutine({
        ...routine,
        steps: routine.steps
      });
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      const response = await fetch(
        `/api/routines/${routine.id}/products?stepId=${stepId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete step');
      }

      setRoutine({
        ...routine,
        steps: routine.steps.filter(step => step.id !== stepId)
      });
      toast.success('Step deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    }
  };

  const handleEditStep = async (stepId: number, newName: string) => {
    try {
      const response = await fetch(`/api/routines/${routine.id}/steps/${stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_step_id: routine.steps.find(s => s.id === stepId)?.user_step_id,
          name: newName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update step name');
      }

      setRoutine(prevRoutine => ({
        ...prevRoutine,
        steps: prevRoutine.steps.map(step => 
          step.id === stepId 
            ? { ...step, user_step: { ...step.user_step, name: newName } }
            : step
        )
      }));
      toast.success('Step name updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating step name:', error);
      toast.error('Failed to update step name');
    }
  };

  const handleProductUpdated = (updatedProduct: UserProductWithDetails) => {
    setEditingProduct(null);
    // Update the product in the routine state
    setRoutine(prevRoutine => ({
      ...prevRoutine,
      steps: prevRoutine.steps.map(step => ({
        ...step,
        products: step.products.map(p => {
          if (p.user_product?.id === updatedProduct.id) {
            return { ...p, user_product: updatedProduct };
          }
          return p;
        })
      }))
    }));
    router.refresh();
  };

  const handleEditProduct = (product: UserProductWithDetails) => {
    setEditingProduct(product);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{routine.name}</h1>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </div>
            {routine.description && (
              <p className="text-gray-700 mt-4">{routine.description}</p>
            )}

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Routine</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Add a description for your routine..."
                  />
                </div>
                <Button 
                  onClick={handleEditSubmit} 
                  className="w-full"
                  disabled={!editForm.name}
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <Label>Step</Label>
                <Select
                  value={stepName}
                  onValueChange={setStepName}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a step" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleansing">Cleansing</SelectItem>
                    <SelectItem value="toning">Toning</SelectItem>
                    <SelectItem value="moisturizing">Moisturizing</SelectItem>
                    {userSteps
                      .filter(step => 
                        !['Cleansing', 'Toning', 'Moisturizing'].includes(step.name)
                      )
                      .map((step) => (
                        <SelectItem key={step.id} value={step.name}>
                          {step.name}
                        </SelectItem>
                      ))}
                    <SelectItem value="custom">Add Custom Step</SelectItem>
                  </SelectContent>
                </Select>
                {stepName === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom step name..."
                    value={customStepName}
                    onChange={(e) => setCustomStepName(e.target.value)}
                  />
                )}
              </div>

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

              <Button 
                onClick={handleAddProduct} 
                className="w-full"
                disabled={!selectedProduct || !stepName || (stepName === 'custom' && !customStepName)}
              >
                Add to Routine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext
            items={routine.steps.map(step => step.id)}
            strategy={verticalListSortingStrategy}
          >
            {routine.steps.map((step) => (
              <SortableStep
                key={step.id}
                step={step}
                onRemoveProduct={handleRemoveProduct}
                onDeleteStep={handleDeleteStep}
                onEditStep={handleEditStep}
                onEditProduct={handleEditProduct}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {routine.steps.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products in this routine yet.</p>
          <p className="text-gray-500 mt-2">Click "Add Product" to get started.</p>
        </div>
      )}

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => {
            console.log("toggling the open state of the diag")
            if (!open) {
              console.log("toggling the open state of the diag")
              setEditingProduct(null);
            }
          }}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
} 