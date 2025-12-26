import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MenuItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  Sparkles,
  Tag,
  Coffee,
  Cookie,
  Zap,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const MenuManagement = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, currentShop } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'tea',
    discount: 0,
    isBestSeller: false,
    isTodaysSpecial: false,
    isAvailable: true,
  });

  const categories = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'tea', label: 'Tea', icon: '🍵' },
    { id: 'snacks', label: 'Snacks', icon: '🥟' },
    { id: 'extra', label: 'Extra', icon: '✨' },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tea': return <Coffee className="w-4 h-4" />;
      case 'snacks': return <Cookie className="w-4 h-4" />;
      case 'extra': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'tea',
      discount: 0,
      isBestSeller: false,
      isTodaysSpecial: false,
      isAvailable: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!currentShop) {
      toast.error('No shop selected. Please log in again.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingItem) {
        const success = await updateMenuItem(editingItem.id, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category: formData.category as 'tea' | 'snacks' | 'extra',
          discount: formData.discount,
          isBestSeller: formData.isBestSeller,
          isTodaysSpecial: formData.isTodaysSpecial,
          isAvailable: formData.isAvailable,
        });
        
        if (success) {
          toast.success('Menu item updated');
          setIsDialogOpen(false);
        } else {
          toast.error('Failed to update menu item');
        }
      } else {
        const newItem = await addMenuItem({
          name: formData.name!,
          description: formData.description || '',
          price: formData.price!,
          category: formData.category as 'tea' | 'snacks' | 'extra',
          discount: formData.discount,
          isBestSeller: formData.isBestSeller,
          isTodaysSpecial: formData.isTodaysSpecial,
          isAvailable: formData.isAvailable ?? true,
        });
        
        if (newItem) {
          toast.success('Menu item added');
          setIsDialogOpen(false);
        } else {
          toast.error('Failed to add menu item');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const success = await deleteMenuItem(id);
      if (success) {
        toast.success('Menu item deleted');
      } else {
        toast.error('Failed to delete menu item');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const toggleAvailability = async (id: string, currentAvailability: boolean) => {
    const success = await updateMenuItem(id, { isAvailable: !currentAvailability });
    if (!success) {
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage your menu items</p>
        </div>

        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className={activeCategory === cat.id ? 'bg-primary text-primary-foreground' : ''}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card 
            key={item.id} 
            className={`overflow-hidden transition-all duration-200 ${
              !item.isAvailable ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    {item.isBestSeller && (
                      <Badge className="bg-accent text-accent-foreground text-xs">
                        <Star className="w-3 h-3 mr-0.5" />
                        Best
                      </Badge>
                    )}
                    {item.isTodaysSpecial && (
                      <Badge className="bg-success text-success-foreground text-xs">
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        Special
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryIcon(item.category)}
                      <span className="ml-1 capitalize">{item.category}</span>
                    </Badge>
                    {item.discount && item.discount > 0 && (
                      <Badge className="bg-destructive/10 text-destructive text-xs">
                        <Tag className="w-3 h-3 mr-0.5" />
                        {item.discount}% off
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-primary">Rs. {item.price}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.isAvailable ? 'Available' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(item)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(item.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No menu items yet</p>
          <Button onClick={openAddDialog} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add your first item
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Masala Tea"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of the item..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (Rs.)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tea">Tea</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="extra">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={100}
                value={formData.discount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                className="mt-1.5"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bestSeller" className="cursor-pointer">Mark as Best Seller</Label>
                <Switch
                  id="bestSeller"
                  checked={formData.isBestSeller}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBestSeller: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="special" className="cursor-pointer">Today's Special</Label>
                <Switch
                  id="special"
                  checked={formData.isTodaysSpecial}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTodaysSpecial: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available" className="cursor-pointer">Available for Order</Label>
                <Switch
                  id="available"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingItem ? 'Save Changes' : 'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Item?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this menu item? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
