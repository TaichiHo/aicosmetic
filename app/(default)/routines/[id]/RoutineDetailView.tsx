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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { RoutineWithSteps } from '@/types/routine';
import { UserProductWithDetails } from '@/types/userProduct';
import { Pencil, GripVertical, MoreVertical, Trash2 } from 'lucide-react';
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
  verticalListSortingStrategy
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

function SortableStep({ 
  step, 
  onRemoveProduct, 
  onDeleteStep, 
  onEditStep,
  onEditProduct 
}: SortableStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(step.step_name || `Step ${step.step_order}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const handleEditSubmit = () => {
    onEditStep(step.id, editName);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={isDragging ? 'opacity-50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
              <GripVertical className="h-5 w-5 text-gray-500" />
            </button>
            <h3 className="font-medium flex-1">{step.step_name || `Step ${step.step_order}`}</h3>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Step Name
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDeleteStep(step.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Step
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Step Name</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="step-name">Step Name</Label>
                    <Input
                      id="step-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g., Cleansing, Toning, Moisturizing..."
                    />
                  </div>
                  <Button 
                    onClick={handleEditSubmit}
                    className="w-full"
                    disabled={!editName.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="pl-7 space-y-4">
            {step.products?.map((product) => (
              <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    {product.user_product?.product.image_url ? (
                      <Image
                        src={product.user_product.product.image_url}
                        alt={product.user_product.product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {product.user_product?.product.brand} -{' '}
                      {product.user_product?.product.name}
                    </p>
                    {product.notes && (
                      <p className="text-sm text-gray-500 mt-1">{product.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.user_product) {
                          onEditProduct(product.user_product);
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveProduct(step.id, product.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RoutineDetailView({ routine: initialRoutine }: RoutineDetailViewProps) {
  const router = useRouter();
  const [routine, setRoutine] = useState(initialRoutine);
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

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (selectedStep === 'new' && !stepName) {
      toast.error('Please enter a step name');
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
          step_order: selectedStep === 'new' ? routine.steps.length + 1 : undefined,
          step_name: selectedStep === 'new' ? stepName : undefined,
          step_id: selectedStep === 'new' ? undefined : selectedStep,
          notes: productNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const newProduct = await response.json();
      
      setRoutine({
        ...routine,
        steps: selectedStep === 'new' 
          ? [...routine.steps, { 
              id: newProduct.routine_step_id,
              routine_id: routine.id,
              step_order: routine.steps.length + 1,
              step_name: stepName,
              created_at: new Date(),
              uuid: '',
              products: [newProduct]
            }]
          : routine.steps.map(step => 
              step.id === selectedStep 
                ? { ...step, products: [...step.products, newProduct] }
                : step
            )
      });

      setIsAddingProduct(false);
      setSelectedProduct('');
      setStepName('');
      setProductNotes('');
      setSelectedStep('new');
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
          step_name: newName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update step name');
      }

      setRoutine({
        ...routine,
        steps: routine.steps.map(step => 
          step.id === stepId 
            ? { ...step, step_name: newName }
            : step
        )
      });
      toast.success('Step name updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating step name:', error);
      toast.error('Failed to update step name');
    }
  };

  const handleProductUpdated = (updatedProduct: UserProductWithDetails) => {
    setRoutine(prevRoutine => ({
      ...prevRoutine,
      steps: prevRoutine.steps.map(step => ({
        ...step,
        products: step.products.map(product => 
          product.user_product?.id === updatedProduct.id
            ? { ...product, user_product: updatedProduct }
            : product
        )
      }))
    }));
    
    toast.success('Product updated successfully');
    
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
            <p className="text-gray-500 mt-2">
              {routine.time_of_day.charAt(0).toUpperCase() + routine.time_of_day.slice(1)} Routine
            </p>
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
                <Label>Step Selection</Label>
                <select
                  value={selectedStep === 'new' ? 'new' : selectedStep}
                  onChange={(e) => setSelectedStep(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                  className="w-full border rounded-md p-2 mt-1"
                >
                  <option value="new">Create New Step</option>
                  {routine.steps.map((step) => (
                    <option key={step.id} value={step.id}>
                      {step.step_name || `Step ${step.step_order}`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStep === 'new' && (
                <div>
                  <Label htmlFor="step-name">New Step Name</Label>
                  <Input
                    id="step-name"
                    value={stepName}
                    onChange={(e) => setStepName(e.target.value)}
                    placeholder="e.g., Cleansing, Toning, Moisturizing..."
                  />
                </div>
              )}

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
                disabled={!selectedProduct || (selectedStep === 'new' && !stepName)}
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
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
} 