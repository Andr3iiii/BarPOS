import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  Button,
  Input,
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
  Alert
} from '@mui/joy';
import { Plus, Edit2 } from 'lucide-react';
import { Category } from '../../types';
import {
  API_BASE,
  expireSession,
  fetchCategories,
  createCategory,
  updateCategory,
  getStoredToken
} from '../../services/api';
import { connectRealtime } from '../../../../../shared/realtime';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState<string>('');
  const [order, setOrder] = useState<string>('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories(true);
      setCategories(data);
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

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setOrder(String(categories.length + 1));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setOrder(String(c.display_order));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          display_order: parseInt(order, 10) || 0
        });
      } else {
        await createCategory({
          name: name.trim(),
          display_order: parseInt(order, 10) || 0
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category.');
    }
  };

  const handleToggleActive = async (c: Category) => {
    try {
      await updateCategory(c.id, { is_active: !c.is_active });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: 'text.primary', fontWeight: 800 }}>
            Menu Categories
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Organize beers, cocktails, wines, and food groups
          </Typography>
        </Box>
        <Button
          size="md"
          variant="solid"
          onClick={openAdd}
          startDecorator={<Plus size={18} />}
          sx={{ bgcolor: 'primary.solidBg', color: '#fff', borderRadius: '12px', '&:hover': { bgcolor: 'primary.solidHoverBg' } }}
        >
          Add Category
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', p: 0, overflow: 'hidden' }}>
        <Table hoverRow sx={{ '& th': { bgcolor: 'background.level1', color: 'text.secondary' }, '& td': { color: 'text.primary' } }}>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Display Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <Typography level="title-sm" sx={{ color: 'text.primary' }}>
                    {c.name}
                  </Typography>
                </td>
                <td>{c.display_order}</td>
                <td>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={c.is_active ? 'success' : 'neutral'}
                    onClick={() => handleToggleActive(c)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {c.is_active ? 'Active' : 'Hidden'}
                  </Chip>
                </td>
                <td>
                  <IconButton size="sm" variant="plain" onClick={() => openEdit(c)} sx={{ color: 'primary.500' }}>
                    <Edit2 size={16} />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{ maxWidth: 440, width: '92vw', bgcolor: 'background.surface', borderColor: 'divider', color: 'text.primary' }}
        >
          <DialogTitle sx={{ color: 'text.primary' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
          <DialogContent>
            {errorMsg && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}
            <form onSubmit={handleSave}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel sx={{ color: 'text.secondary' }}>Category Name</FormLabel>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ color: 'text.secondary' }}>Display Order</FormLabel>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                  />
                </FormControl>
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setIsModalOpen(false)} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    type="submit"
                    sx={{ flex: 1, bgcolor: 'primary.solidBg', color: '#fff', '&:hover': { bgcolor: 'primary.solidHoverBg' } }}
                  >
                    Save Category
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
