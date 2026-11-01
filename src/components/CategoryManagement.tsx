import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Layers, Package, ArrowLeft } from 'lucide-react';
import { Product, Category } from '@/lib/storage';
import { managedCategoryStorage as categoryStorage, managedProductStorage as productStorage } from '@/lib/managedStorage';
import AddCategoryForm from './AddCategoryForm';

const CategoryManagement: React.FC = () => {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        loadData();

        const handleUpdate = () => loadData();
        window.addEventListener('storage-updated', handleUpdate);
        return () => window.removeEventListener('storage-updated', handleUpdate);
    }, []);

    const loadData = () => {
        setCategories(categoryStorage.getAll());
        setProducts(productStorage.getAll());
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowAddDialog(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowAddDialog(true);
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (window.confirm(t('confirmDeleteCategory') || 'Are you sure you want to delete this category?')) {
            categoryStorage.delete(categoryId);
            loadData();
            window.dispatchEvent(new Event('storage-updated'));
        }
    };

    const handleSaveCategory = (category: Category) => {
        setShowAddDialog(false);
        setEditingCategory(null);
        loadData();
        window.dispatchEvent(new Event('storage-updated'));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-6 gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">{t('categories') || 'Category Management'}</h1>
                    <p className="text-gray-600 mt-1 text-center">{t('manageCategoriesDesc') || 'Organize your products with categories'}</p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-6">
                    <Button onClick={handleAddCategory} size="lg" className="bg-primary-600 hover:bg-primary-700 text-white min-h-[48px] px-8 shadow-md">
                        <Plus className="w-5 h-5 mr-2" />
                        {t('addCategory') || 'New Category'}
                    </Button>
                </div>

                {/* Search */}
                <Card className="mb-6 shadow-sm">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder={t('searchCategories') || 'Search categories...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-12 text-lg border-primary-100 focus:ring-primary-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Table */}
                <Card className="shadow-lg border-0 overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-primary-800">
                            <Layers className="w-6 h-6" />
                            {t('allCategories') || 'All Categories'} ({filteredCategories.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="py-4 text-primary-900 font-bold">{t('categoryName') || 'Category Name'}</TableHead>
                                        <TableHead className="py-4 text-center text-primary-900 font-bold">{t('productCount') || 'Products'}</TableHead>
                                        <TableHead className="py-4 text-center text-primary-900 font-bold">{t('createdAt') || 'Created'}</TableHead>
                                        <TableHead className="py-4 text-center text-primary-900 font-bold">{t('actions') || 'Actions'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCategories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400 italic">
                                                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                {t('noCategoriesFound') || 'No categories found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCategories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((category) => {
                                            const count = products.filter(p => p.categoryId === category.id).length;
                                            return (
                                                <TableRow key={category.id} className="hover:bg-primary-50/30 transition-colors">
                                                    <TableCell className="font-semibold text-gray-900 py-4">
                                                        {category.name}
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                                            {count} {t('products')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm text-gray-500 py-4">
                                                        {new Date(category.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditCategory(category)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-10 w-10 p-0 rounded-full"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteCategory(category.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0 rounded-full"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {showAddDialog && (
                <AddCategoryForm
                    onSave={handleSaveCategory}
                    onCancel={() => setShowAddDialog(false)}
                    editingCategory={editingCategory}
                    onDelete={handleDeleteCategory}
                />
            )}
        </div>
    );
};

export default CategoryManagement;
