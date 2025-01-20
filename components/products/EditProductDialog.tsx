import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserProductWithDetails } from '@/types/userProduct';

interface EditProductDialogProps {
  product: UserProductWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: (updatedProduct: UserProductWithDetails) => void;
}

export default function EditProductDialog({
  product,
  open,
  onOpenChange,
  onProductUpdated
}: EditProductDialogProps) {
  const [form, setForm] = useState({
    brand: product.product.brand,
    name: product.product.name,
    category_id: product.product.category_id,
    description: product.product.description || '',
    size_value: product.product.size_value,
    size_unit: product.product.size_unit,
    notes: product.notes || ''
  });

  // Reset form when dialog opens with new product
  useEffect(() => {
    if (open) {
      setForm({
        brand: product.product.brand,
        name: product.product.name,
        category_id: product.product.category_id,
        description: product.product.description || '',
        size_value: product.product.size_value,
        size_unit: product.product.size_unit,
        notes: product.notes || ''
      });
    }
  }, [open, product]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/user-products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand: form.brand,
          name: form.name,
          category_id: form.category_id,
          description: form.description,
          size_value: form.size_value,
          size_unit: form.size_unit,
          notes: form.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();
      onProductUpdated(updatedProduct);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Clean up form state before closing
          setForm({
            brand: product.product.brand,
            name: product.product.name,
            category_id: product.product.category_id,
            description: product.product.description || '',
            size_value: product.product.size_value,
            size_unit: product.product.size_unit,
            notes: product.notes || ''
          });
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.category_id.toString()}
              onValueChange={(value) => setForm({ ...form, category_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Add categories from API */}
                <SelectItem value="1">Cleanser</SelectItem>
                <SelectItem value="2">Toner</SelectItem>
                <SelectItem value="3">Serum</SelectItem>
                <SelectItem value="4">Moisturizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="size_value">Size</Label>
              <Input
                id="size_value"
                type="number"
                value={form.size_value}
                onChange={(e) => setForm({ ...form, size_value: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="size_unit">Unit</Label>
              <Select
                value={form.size_unit}
                onValueChange={(value) => setForm({ ...form, size_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="oz">oz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 