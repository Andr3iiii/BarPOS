import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
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
  Chip,
  Sheet
} from '@mui/joy';
import {
  Plus,
  Minus,
  Search,
  ShoppingBag,
  X,
  Trash2,
  Beer,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Product, Order, Category, BarTable } from '../types';
import { fetchProducts, fetchCategories, fetchTables, createDirectOrder } from '../services/api';
import { createIdempotencyKey } from '../../../../shared/idempotency';

interface WalkInOrderModalProps {
  open: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const WalkInOrderModal: React.FC<WalkInOrderModalProps> = ({ open, onClose, onOrderCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<BarTable[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [tableNumber, setTableNumber] = useState<string>('BAR-1');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const orderSubmissionKey = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchProducts().catch(() => []),
        fetchCategories().catch(() => []),
        fetchTables(true).catch(() => [])
      ]).then(([prods, cats, tbls]) => {
        setProducts(prods.filter((p) => p.is_available));
        setCategories(cats);
        setTables(tbls);
      });

      setCart(new Map());
      setSearch('');
      setCustomerNotes('');
      setSelectedCategory('ALL');
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

  const removeCartItem = (productId: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  const cartItemsList = useMemo(() => {
    const list: Array<{ product: Product; quantity: number; subtotal: number }> = [];
    cart.forEach((qty, pid) => {
      const p = products.find((item) => item.id === pid);
      if (p) {
        list.push({ product: p, quantity: qty, subtotal: p.price * qty });
      }
    });
    return list;
  }, [cart, products]);

  const cartTotal = useMemo(() => {
    return cartItemsList.reduce((acc, it) => acc + it.subtotal, 0);
  }, [cartItemsList]);

  const totalItemCount = useMemo(() => {
    return cartItemsList.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItemsList]);

  const handleSubmit = async () => {
    if (cart.size === 0) {
      setErrorMsg('Please select at least one drink/item from the menu.');
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
        customer_notes: customerNotes.trim() || 'Counter / Walk-in Order',
        idempotency_key: orderSubmissionKey.current || (orderSubmissionKey.current = createIdempotencyKey()),
        items
      });

      orderSubmissionKey.current = null;
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
          maxWidth: 1040,
          width: '96vw',
          maxHeight: '92vh',
          height: '90vh',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          color: 'text.primary',
          borderRadius: '24px',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'xl'
        }}
      >
        {/* Modal Header */}
        <Box sx={{ p: 2.5, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  p: 1,
                  borderRadius: '10px',
                  bgcolor: 'primary.softBg',
                  color: 'primary.500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingBag size={20} />
              </Box>
              <Box>
                <Typography level="title-lg" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                  Counter / Walk-in Register
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  Tap items to quickly build an order ticket
                </Typography>
              </Box>
            </Stack>

            <IconButton
              size="sm"
              variant="plain"
              onClick={onClose}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'background.level1' } }}
            >
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        {errorMsg && (
          <Alert color="danger" sx={{ mx: 3, mt: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Modal Body: 2-Panel POS Layout */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
          {/* LEFT PANEL: Menu Catalog (60%) */}
          <Box
            sx={{
              flex: { xs: 1, md: 3 },
              borderRight: { xs: 'none', md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              p: 2.5,
              overflow: 'hidden'
            }}
          >
            {/* Search & Category Pills */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Input
                size="md"
                placeholder="Search menu items..."
                startDecorator={<Search size={18} color="var(--joy-palette-text-tertiary, #71717a)" />}
                endDecorator={
                  search ? (
                    <IconButton size="sm" variant="plain" onClick={() => setSearch('')} sx={{ color: 'text.secondary' }}>
                      <X size={14} />
                    </IconButton>
                  ) : null
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  bgcolor: 'background.level1',
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '10px'
                }}
              />

              {/* Category Pills */}
              <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', pb: 0.5 }}>
                <Chip
                  variant={selectedCategory === 'ALL' ? 'solid' : 'outlined'}
                  color="primary"
                  onClick={() => setSelectedCategory('ALL')}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    borderRadius: '8px',
                    bgcolor: selectedCategory === 'ALL' ? 'primary.solidBg' : 'background.level1',
                    borderColor: 'divider',
                    color: selectedCategory === 'ALL' ? '#fff' : 'text.secondary'
                  }}
                >
                  All Items ({products.length})
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    variant={selectedCategory === c.id ? 'solid' : 'outlined'}
                    color="primary"
                    onClick={() => setSelectedCategory(c.id)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderRadius: '8px',
                      bgcolor: selectedCategory === c.id ? 'primary.solidBg' : 'background.level1',
                      borderColor: 'divider',
                      color: selectedCategory === c.id ? '#fff' : 'text.secondary',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.name}
                  </Chip>
                ))}
              </Stack>
            </Stack>

            {/* Products Grid */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                gap: 1.5,
                pr: 0.5,
                alignContent: 'start'
              }}
            >
              {filteredProducts.map((p) => {
                const qty = cart.get(p.id) || 0;
                return (
                  <Card
                    key={p.id}
                    variant="outlined"
                    onClick={() => updateCart(p.id, 1)}
                    sx={{
                      cursor: 'pointer',
                      p: 1.8,
                      borderRadius: '14px',
                      bgcolor: qty > 0 ? 'background.surface' : 'background.level1',
                      borderColor: qty > 0 ? 'primary.500' : 'divider',
                      boxShadow: qty > 0 ? '0 2px 10px rgba(224, 86, 36, 0.12)' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 100,
                      '&:hover': {
                        borderColor: 'primary.400',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box>
                      <Typography
                        level="title-sm"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        {p.name}
                      </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Typography level="title-md" sx={{ color: 'primary.500', fontWeight: 800 }}>
                        ₱{Number(p.price).toFixed(2)}
                      </Typography>

                      {qty > 0 ? (
                        <Chip
                          size="sm"
                          variant="solid"
                          color="primary"
                          sx={{ fontWeight: 800, fontSize: '11px', px: 1 }}
                        >
                          {qty} in ticket
                        </Chip>
                      ) : (
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            bgcolor: 'background.level2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.secondary'
                          }}
                        >
                          <Plus size={15} />
                        </Box>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* RIGHT PANEL: Current Ticket / Order Summary (40%) */}
          <Box
            sx={{
              flex: { xs: 1, md: 2 },
              bgcolor: 'background.surface',
              display: 'flex',
              flexDirection: 'column',
              p: 2.5,
              overflow: 'hidden'
            }}
          >
            {/* Ticket Header & Destination Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.8 }}>
                Order Destination
              </Typography>
              <Select
                value={tableNumber}
                onChange={(_, val) => val && setTableNumber(val)}
                sx={{
                  bgcolor: 'background.level1',
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '10px',
                  fontWeight: 600
                }}
              >
                <Option value="BAR-1">🍸 Bar Counter 1 (Walk-in)</Option>
                <Option value="BAR-2">🍸 Bar Counter 2 (Walk-in)</Option>
                <Option value="TAKE-OUT">🛍️ Take-Out / To-Go</Option>
                {tables.map((t) => (
                  <Option key={t.id} value={t.table_number}>
                    Table {t.table_number} ({t.label})
                  </Option>
                ))}
              </Select>
            </Box>

            <Divider sx={{ mb: 2, borderColor: 'divider' }} />

            {/* Ticket Items List */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, mb: 2 }}>
              {cartItemsList.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.tertiary' }}>
                  <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <Typography level="body-sm" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Order Ticket is Empty
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                    Select drinks from the menu catalog on the left to add items.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.2}>
                  {cartItemsList.map(({ product, quantity, subtotal }) => (
                    <Box
                      key={product.id}
                      sx={{
                        p: 1.2,
                        borderRadius: '10px',
                        bgcolor: 'background.level1',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                        <Typography level="title-sm" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          {product.name}
                        </Typography>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => removeCartItem(product.id)}
                          sx={{ p: 0.2 }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.6}>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            onClick={() => updateCart(product.id, -1)}
                            sx={{ borderRadius: '6px', width: 26, height: 26, minHeight: 26, p: 0 }}
                          >
                            <Minus size={13} />
                          </IconButton>
                          <Typography level="body-sm" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                            {quantity}
                          </Typography>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            onClick={() => updateCart(product.id, 1)}
                            sx={{ borderRadius: '6px', width: 26, height: 26, minHeight: 26, p: 0 }}
                          >
                            <Plus size={13} />
                          </IconButton>
                        </Stack>

                        <Typography level="title-sm" sx={{ color: 'primary.500', fontWeight: 700 }}>
                          ₱{subtotal.toFixed(2)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Bartender / Order Notes */}
            <Box sx={{ mb: 2 }}>
              <Input
                size="sm"
                placeholder="Order notes (e.g. Extra lime, less sweet)..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                sx={{
                  bgcolor: 'background.level1',
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '8px'
                }}
              />
            </Box>

            {/* Ticket Totals & Submission */}
            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Items Selected:
                </Typography>
                <Typography level="body-sm" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography level="title-md" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Total Bill
                </Typography>
                <Typography level="h2" sx={{ fontWeight: 900, color: 'primary.500' }}>
                  ₱{cartTotal.toFixed(2)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  loading={submitting}
                  disabled={cart.size === 0}
                  onClick={handleSubmit}
                  startDecorator={<CheckCircle2 size={18} />}
                  sx={{
                    flex: 1,
                    bgcolor: 'primary.solidBg',
                    color: '#fff',
                    fontWeight: 800,
                    borderRadius: '10px',
                    py: 1.2,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: 'primary.solidHoverBg' }
                  }}
                >
                  Proceed to Payment (₱{cartTotal.toFixed(2)})
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default WalkInOrderModal;
