import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserStep } from '@/types/routine';

interface ManageStepsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_STEPS = ['Cleansing', 'Toning', 'Moisturizing'];

export default function ManageStepsDialog({
  open,
  onOpenChange
}: ManageStepsDialogProps) {
  const [steps, setSteps] = useState<UserStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSteps = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user-steps');
      if (!response.ok) {
        throw new Error('Failed to load steps');
      }
      const data = await response.json();
      setSteps(data);
    } catch (error) {
      console.error('Error loading steps:', error);
      toast.error('Failed to load steps');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSteps();
    }
  }, [open]);

  const handleDeleteStep = async (stepId: number) => {
    try {
      const response = await fetch(`/api/user-steps/${stepId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete step');
      }

      setSteps(steps.filter(step => step.id !== stepId));
      toast.success('Step deleted successfully');
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Steps</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading steps...</div>
          ) : steps.length === 0 ? (
            <div className="text-center py-4">No custom steps found</div>
          ) : (
            <div className="space-y-2">
              {steps.map((step) => {
                const isDefaultStep = DEFAULT_STEPS.includes(step.name);
                return (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span>{step.name}</span>
                      {isDefaultStep && (
                        <span className="ml-2 text-xs text-gray-500">(Default step)</span>
                      )}
                    </div>
                    {!isDefaultStep && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 