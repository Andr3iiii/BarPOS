import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  Button,
  Input,
  Select,
  Option,
  IconButton,
  Chip,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  Stack,
  Divider,
  Alert,
  Switch
} from '@mui/joy';
import { Plus, Edit2, Trash2, Search, Wine, CheckCircle2, XCircle } from 'lucide-react';
import { Product, Category } from '../types';
import {
  API_BASE,
  expireSession,
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteOrDeactivateProduct
} from '../services/api';
import { getStoredToken } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<number>(1);
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formAvailable, setFormAvailable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([fetchProducts(true), fetchCategories(true)]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const token = getStoredToken();
    if (!token) return;
    const socket = connectRealtime({ apiBase: API_BASE, token, onUnauthorized: expireSession });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let hasConnected = false;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadData(), 150);
    };
    socket.on('inventory.updated', scheduleRefresh);
    socket.on('connect', () => {
      if (hasConnected) scheduleRefresh();
      hasConnected = true;
    });
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0]?.id || 1);
    setFormPrice('');
    setFormDesc('');
    setFormAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category_id);
    setFormPrice(String(p.price));
    setFormDesc(p.description || '');
    setFormAvailable(p.is_available);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      setFormError('Product name and price are required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        name: formName.trim(),
        category_id: formCategory,
        price: parseFloat(formPrice),
        description: formDesc.trim() || null,
        is_available: formAvailable
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteOrDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove or deactivate this product?')) return;
    try {
      const msg = await deleteOrDeactivateProduct(id);
      alert(msg);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const toggleAvailability = async (p: Product) => {
    try {
      await updateProduct(p.id, { is_available: !p.is_available });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
            Product Catalog
          </Typography>
          <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
            Manage drinks, cocktails, beers, and bar food items
          </Typography>
        </Box>
        <Button
          size="md"
          variant="solid"
          onClick={openAddModal}
          startDecorator={<Plus size={18} />}
          sx={{ bgcolor: '#e05624', color: '#fff', borderRadius: '12px', '&:hover': { bgcolor: '#c8461b' } }}
        >
          Add New Product
        </Button>
      </Stack>

      {/* Filter and Search Bar */}
      <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Input
            placeholder="Search products..."
            startDecorator={<Search size={18} color="#71717a" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
          />
          <Select<string | number>
            value={selectedCategory}
            onChange={(_, val) => val !== null && setSelectedCategory(val as any)}
            sx={{ minWidth: 220, bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
          >
            <Option value="ALL">All Categories</Option>
            {categories.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Stack>
      </Card>

      {/* Products Table */}
      <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 0, overflow: 'hidden' }}>
        <Table hoverRow sx={{ '& th': { bgcolor: '#181b2a', color: '#8f95b2' }, '& td': { color: '#e4e4e7' } }}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id}>
                <td>
                  <Typography level="title-sm" sx={{ color: '#fff' }}>
                    {p.name}
                  </Typography>
                  {p.description && (
                    <Typography level="body-xs" sx={{ color: '#71717a' }}>
                      {p.description}
                    </Typography>
                  )}
                </td>
                <td>
                  <Chip size="sm" variant="soft" sx={{ bgcolor: '#1d2238', color: '#a1a1aa' }}>
                    {p.category_name || 'Drinks'}
                  </Chip>
                </td>
                <td>
                  <Typography level="title-sm" sx={{ color: '#ff7a45', fontWeight: 700 }}>
                    ₱{Number(p.price).toFixed(2)}
                  </Typography>
                </td>
                <td>
                  <Switch
                    checked={p.is_available}
                    onChange={() => toggleAvailability(p)}
                    color={p.is_available ? 'success' : 'neutral'}
                    endDecorator={
                      <Typography level="body-xs" sx={{ color: p.is_available ? '#34d399' : '#71717a' }}>
                        {p.is_available ? 'Available' : 'Disabled'}
                      </Typography>
                    }
                  />
                </td>
                <td>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="sm" variant="plain" onClick={() => openEditModal(p)} sx={{ color: '#ff7a45' }}>
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={() => handleDeleteOrDeactivate(p.id)}
                      sx={{ color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{ maxWidth: 500, width: '92vw', bgcolor: '#131522', borderColor: '#2e3450', color: '#fff' }}
        >
          <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />
          <DialogContent>
            {formError && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <form onSubmit={handleSaveProduct}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Product Name</FormLabel>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Category</FormLabel>
                  <Select
                    value={formCategory}
                    onChange={(_, val) => val && setFormCategory(Number(val))}
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  >
                    {categories.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Price (₱)</FormLabel>
                  <Input
                    required
                    type="number"
                    slotProps={{ input: { step: '0.01' } }}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Description</FormLabel>
                  <Input
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Short ingredients or flavor notes"
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  />
                </FormControl>

                <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Available on Menu</FormLabel>
                  <Switch checked={formAvailable} onChange={(e) => setFormAvailable(e.target.checked)} />
                </FormControl>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setIsModalOpen(false)} sx={{ borderColor: '#333' }}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    type="submit"
                    loading={formLoading}
                    sx={{ flex: 1, bgcolor: '#e05624', '&:hover': { bgcolor: '#c8461b' } }}
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </Box>
  );
};
