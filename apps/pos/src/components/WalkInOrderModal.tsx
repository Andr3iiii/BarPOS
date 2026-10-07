import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Divider,
  Button,
  Stack,
  Typography,
  Box,
  Input,
  Select,
  Option,
  Card,
  IconButton,
  Alert,
  Chip
} from '@mui/joy';
import { Plus, Minus, Search, ShoppingBag, X } from 'lucide-react';
import { Product, Order } from '../types';
import { fetchProducts, createDirectOrder } from '../services/api';

interface WalkInOrderModalProps {
  open: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const WalkInOrderModal: React.FC<WalkInOrderModalProps> = ({ open, onClose, onOrderCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('BAR-1');
  const [search, setSearch] = useState<string>('');
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProducts()
        .then((items) => setProducts(items.filter((p) => p.is_available)))
        .catch(console.error);
      setCart(new Map());
      setSearch('');
      setErrorMsg(null);
    }
  }, [open]);

  const updateCart = (productId: number, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const cur = next.get(productId) || 0;
      const updated = cur + delta;
      if (updated <= 0) {
        next.delete(productId);
      } else {
        next.set(productId, updated);
      }
      return next;
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const cartTotal = useMemo(() => {
    let sum = 0;
    cart.forEach((qty, pid) => {
      const p = products.find((item) => item.id === pid);
      if (p) sum += p.price * qty;
    });
    return sum;
  }, [cart, products]);

  const handleSubmit = async () => {
    if (cart.size === 0) {
      setErrorMsg('Please select at least one item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const items: Array<{ product_id: number; quantity: number }> = [];
      cart.forEach((qty, pid) => {
        items.push({ product_id: pid, quantity: qty });
      });

      const newOrder = await createDirectOrder({
        table_number: tableNumber,
        customer_notes: 'Walk-in / Bar Counter Order',
        items
      });

      onOrderCreated(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 750,
          width: '95vw',
          bgcolor: '#131522',
          borderColor: '#2e3450',
          color: '#f4f4f5',
          borderRadius: '20px',
          p: 3
        }}
      >
        <DialogTitle sx={{ color: '#f4f4f5', display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingBag size={22} color="#ff7a45" />
            <span>New Counter / Walk-in Order</span>
          </Stack>
          <IconButton size="sm" variant="plain" onClick={onClose} sx={{ color: '#a1a1aa' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />

        <DialogContent sx={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {errorMsg && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Table select & search bar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ minWidth: 180 }}>
              <Typography level="body-xs" sx={{ color: '#a1a1aa', mb: 0.5 }}>
                Location / Table:
              </Typography>
              <Select
                value={tableNumber}
                onChange={(_, val) => val && setTableNumber(val)}
                sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
              >
                <Option value="BAR-1">Bar Counter 1</Option>
                <Option value="BAR-2">Bar Counter 2</Option>
                <Option value="1">Table 1</Option>
                <Option value="2">Table 2</Option>
                <Option value="3">Table 3</Option>
                <Option value="4">Table 4</Option>
                <Option value="5">Table 5</Option>
                <Option value="6">Table 6</Option>
              </Select>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ color: '#a1a1aa', mb: 0.5 }}>
                Search Menu:
              </Typography>
              <Input
                placeholder="Search items..."
                startDecorator={<Search size={16} color="#71717a" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
              >
              </Input>
            </Box>
          </Stack>

          {/* Product Items Selection Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              maxHeight: 300,
              overflowY: 'auto',
              p: 0.5
            }}
          >
            {filteredProducts.map((p) => {
              const qty = cart.get(p.id) || 0;
              return (
                <Card
                  key={p.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: '#181b2a',
                    borderColor: qty > 0 ? '#ff7a45' : '#272c43',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ pr: 1 }}>
                    <Typography level="title-sm" sx={{ color: '#fff' }}>
                      {p.name}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: '#ff7a45', fontWeight: 600 }}>
                      ₱{Number(p.price).toFixed(2)}
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    {qty > 0 && (
                      <IconButton
                        size="sm"
                        variant="soft"
                        onClick={() => updateCart(p.id, -1)}
                        sx={{ bgcolor: '#24283b', color: '#ff7a45' }}
                      >
                        <Minus size={14} />
                      </IconButton>
                    )}
                    {qty > 0 && (
                      <Typography level="title-sm" sx={{ minWidth: 18, textAlign: 'center', color: '#fff' }}>
                        {qty}
                      </Typography>
                    )}
                    <IconButton
                      size="sm"
                      variant="solid"
                      onClick={() => updateCart(p.id, 1)}
                      sx={{ bgcolor: '#e05624', color: '#fff', '&:hover': { bgcolor: '#c8461b' } }}
                    >
                      <Plus size={14} />
                    </IconButton>
                  </Stack>
                </Card>
              );
            })}
          </Box>

          {/* Cart Bar */}
          <Box sx={{ mt: 2.5, p: 2, bgcolor: '#1c2033', borderRadius: '12px', border: '1px solid #2e3552' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-md" sx={{ color: '#f4f4f5', fontWeight: 600 }}>
                Total Selected: {cart.size} item(s)
              </Typography>
              <Typography level="h3" sx={{ color: '#ff7a45', fontWeight: 800 }}>
                ₱{cartTotal.toFixed(2)}
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderColor: '#3a4163', color: '#a1a1aa' }}>
            Cancel
          </Button>
          <Button
            variant="solid"
            loading={submitting}
            disabled={cart.size === 0}
            onClick={handleSubmit}
            sx={{ flex: 1, bgcolor: '#e05624', color: '#fff', '&:hover': { bgcolor: '#c8461b' } }}
          >
            Create & Proceed to Payment
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};
