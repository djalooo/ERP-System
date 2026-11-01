import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Category, categoryStorage } from '@/lib/storage';

interface AddCategoryFormProps {
  onSave: (category: Category) => void;
  onCancel: () => void;
  editingCategory?: Category | null;
  onDelete?: (categoryId: string) => void;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onSave, onCancel, editingCategory, onDelete }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name
      });
    }
  }, [editingCategory]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('categoryNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory: Category = {
          ...editingCategory,
          name: formData.name.trim(),
          updatedAt: new Date().toISOString()
        };
        categoryStorage.update(editingCategory.id, updatedCategory);
        onSave(updatedCategory);
      } else {
        // Create new category
        const newCategory: Category = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        categoryStorage.add(newCategory);
        onSave(newCategory);
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (editingCategory && onDelete) {
      onDelete(editingCategory.id);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2 text-primary-700">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory ? 'Update the category name.' : 'Add a new category to organize your products.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder={t('category name')}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>



          <div className="flex justify-between items-center pt-4">
            {/* زر الحذف على اليسار */}
            <div>
              {editingCategory && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="touch-manipulation h-[48px] w-[48px]"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* أزرار الإلغاء والحفظ على اليمين */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="touch-manipulation min-h-[48px]"
              >{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700 touch-manipulation min-h-[48px]">
                {isSubmitting ? t('saving') : (editingCategory ? 'Update' : t('save'))}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryForm;