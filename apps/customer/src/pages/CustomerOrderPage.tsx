import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Sheet,
  Button,
  IconButton,
  Chip,
  Input,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Textarea
} from '@mui/joy';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Wine,
  Beer,
  Sparkles,
  Utensils,
  Pizza,
  Coffee,
  LayoutGrid,
  Info,
  Clock,
  ArrowRight,
  X,
  RotateCcw
} from 'lucide-react';
import { Product, Category, BarTable, BAR_SETTINGS } from '@barpos/shared';
import { fetchPublicMenu, fetchCategories, verifyTable, submitOrder } from '../services/api';
import { ProductGridCard } from '../components/ProductGridCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { getProductImageUrl } from '../utils/productImages';

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const CustomerOrderPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<BarTable | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Product detail modal state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Load table and menu
  useEffect(() => {
    async function loadData() {
      if (!tableNumber) {
        setError('Table identifier is missing from QR URL.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [tableData, catData, menuData] = await Promise.all([
          verifyTable(tableNumber),
          fetchCategories(),
          fetchPublicMenu()
        ]);

        setTable(tableData);
        setCategories(catData);
        setProducts(menuData);
      } catch (err: any) {
        setError(err.message || 'Unable to connect to the bar system. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tableNumber]);

  // Cart helpers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleConfirmDetail = (product: Product, quantity: number, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity, notes } : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Submit order
  const handleSubmitOrder = async () => {
    if (!table || cart.length === 0) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const orderResult = await submitOrder({
        table_number: table.table_number,
        customer_notes: customerNotes,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          item_notes: item.notes
        }))
      });

      // Clear cart
      setCart([]);
      setIsCartOpen(false);

      // Navigate to order confirmation
      navigate(`/order/confirmed/${orderResult.reference_no}`, {
        state: { order: orderResult, tableNumber: table.table_number }
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to submit your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('beer')) return <Beer size={15} />;
    if (name.includes('cocktail') || name.includes('wine')) return <Wine size={15} />;
    if (name.includes('spirit') || name.includes('shot')) return <Sparkles size={15} />;
    if (name.includes('bite') || name.includes('starter')) return <Utensils size={15} />;
    if (name.includes('food') || name.includes('main') || name.includes('pizza') || name.includes('burger'))
      return <Pizza size={15} />;
    if (name.includes('drink') || name.includes('non-alcoholic') || name.includes('coffee') || name.includes('tea'))
      return <Coffee size={15} />;
    return <Wine size={15} />;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
          backgroundColor: '#0b0d14'
        }}
      >
        <CircularProgress size="lg" sx={{ color: '#e05624' }} />
        <Typography level="body-md" sx={{ color: '#a1a1aa' }}>
          Loading menu for Table {tableNumber}...
        </Typography>
      </Box>
    );
  }

  if (error || !table) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          backgroundColor: '#0b0d14',
          textAlign: 'center'
        }}
      >
        <Typography level="h3" sx={{ color: '#ff6b4a', mb: 1, fontWeight: 700 }}>
          Welcome to {BAR_SETTINGS.NAME}
        </Typography>
        <Alert
          color="danger"
          variant="soft"
          sx={{
            maxWidth: 420,
            mb: 3,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: '#fca5a5'
          }}
        >
          {error || 'Unable to identify this table. Please scan the QR code located on your table.'}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          startDecorator={<RotateCcw size={16} />}
          sx={{ borderColor: '#333852', color: '#f4f4f5' }}
        >
          Retry Connection
        </Button>
      </Box>
    );
  }

  const activeDetailCartItem = detailProduct
    ? cart.find((item) => item.product.id === detailProduct.id)
    : undefined;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0b0d14',
        pb: cart.length > 0 ? 12 : 6,
        maxWidth: 960,
        mx: 'auto'
      }}
    >
      {/* Sticky Header */}
      <Sheet
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: 'rgba(11, 13, 20, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1f2334'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography level="title-lg" sx={{ color: '#f4f4f5', fontWeight: 800, letterSpacing: '0.03em' }}>
              {BAR_SETTINGS.NAME}
            </Typography>
            <Typography level="body-xs" sx={{ color: '#8f95b0' }}>
              {BAR_SETTINGS.TAGLINE}
            </Typography>
          </Box>
          <Chip
            variant="soft"
            size="lg"
            sx={{
              bgcolor: 'rgba(224, 86, 36, 0.16)',
              color: '#ff7a45',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: '1px solid rgba(224, 86, 36, 0.35)',
              px: 1.8,
              py: 0.5,
              borderRadius: '12px'
            }}
          >
            {table.label}
          </Chip>
        </Stack>

        {/* Search Bar */}
        <Box sx={{ mt: 2 }}>
          <Input
            placeholder="Search drinks, cocktails, food..."
            startDecorator={<Search size={18} color="#71717a" />}
            endDecorator={
              searchQuery ? (
                <IconButton size="sm" variant="plain" onClick={() => setSearchQuery('')} sx={{ color: '#8f95b0' }}>
                  <X size={16} />
                </IconButton>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              bgcolor: '#151826',
              borderColor: '#262b42',
              color: '#f4f4f5',
              borderRadius: '12px',
              '&:hover': { borderColor: '#3b4366' },
              '&:focus-within': { borderColor: '#e05624' }
            }}
          />
        </Box>
      </Sheet>

      {/* Category Pills (Horizontal Scroll) */}
      <Box
        className="no-scrollbar"
        sx={{
          display: 'flex',
          gap: 1,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          overflowX: 'auto',
          position: 'sticky',
          top: 108,
          zIndex: 35,
          bgcolor: 'rgba(11, 13, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #1a1e2f'
        }}
      >
        <Button
          size="sm"
          variant={selectedCategory === 'ALL' ? 'solid' : 'outlined'}
          onClick={() => setSelectedCategory('ALL')}
          startDecorator={<LayoutGrid size={15} />}
          sx={{
            borderRadius: '24px',
            flexShrink: 0,
            bgcolor: selectedCategory === 'ALL' ? '#e05624' : '#141724',
            borderColor: selectedCategory === 'ALL' ? '#e05624' : '#272b3f',
            color: selectedCategory === 'ALL' ? '#fff' : '#a1a1aa',
            fontWeight: 600,
            fontSize: '0.82rem',
            '&:hover': { bgcolor: selectedCategory === 'ALL' ? '#c8461b' : '#1c2032' }
          }}
        >
          All Items ({products.length})
        </Button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <Button
              key={cat.id}
              size="sm"
              variant={isSelected ? 'solid' : 'outlined'}
              onClick={() => setSelectedCategory(cat.id)}
              startDecorator={getCategoryIcon(cat.name)}
              sx={{
                borderRadius: '24px',
                flexShrink: 0,
                bgcolor: isSelected ? '#e05624' : '#141724',
                borderColor: isSelected ? '#e05624' : '#272b3f',
                color: isSelected ? '#fff' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '0.82rem',
                '&:hover': { bgcolor: isSelected ? '#c8461b' : '#1c2032' }
              }}
            >
              {cat.name} ({count})
            </Button>
          );
        })}
      </Box>

      {/* Product Grid Layout */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography level="title-md" sx={{ color: '#8b92ad', mb: 1 }}>
              No products found matching your search.
            </Typography>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <Button
                size="sm"
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                sx={{ mt: 1, borderColor: '#333852', color: '#f4f4f5' }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: { xs: 1.5, sm: 2 }
            }}
          >
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;

              return (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  quantityInCart={qtyInCart}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onOpenDetails={(p) => setDetailProduct(p)}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        currentQuantity={activeDetailCartItem ? activeDetailCartItem.quantity : 0}
        currentNotes={activeDetailCartItem?.notes}
        onConfirm={handleConfirmDetail}
      />

      {/* Sticky Bottom Cart Bar */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            maxWidth: 520,
            mx: 'auto',
            zIndex: 50
          }}
        >
          <Button
            size="lg"
            variant="solid"
            onClick={() => setIsCartOpen(true)}
            sx={{
              width: '100%',
              bgcolor: '#e05624',
              color: '#fff',
              py: 1.6,
              px: 2.5,
              borderRadius: '16px',
              boxShadow: '0 8px 28px rgba(224, 86, 36, 0.45)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&:hover': { bgcolor: '#c8461b' }
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ShoppingCart size={22} />
              <Typography level="title-md" sx={{ color: '#fff', fontWeight: 700 }}>
                View Order ({cartItemCount})
              </Typography>
            </Stack>
            <Typography level="title-lg" sx={{ color: '#fff', fontWeight: 800 }}>
              ₱{cartTotal.toFixed(2)}
            </Typography>
          </Button>
        </Box>
      )}

      {/* Cart Review Modal */}
      <Modal open={isCartOpen} onClose={() => setIsCartOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: 520,
            width: '92vw',
            bgcolor: '#12141f',
            borderColor: '#292e47',
            color: '#f4f4f5',
            borderRadius: '22px',
            p: 3
          }}
        >
          <DialogTitle sx={{ color: '#f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography level="title-lg" sx={{ color: '#f4f4f5', fontWeight: 700 }}>
              Review Your Order
            </Typography>
            <Chip size="sm" variant="soft" sx={{ bgcolor: 'rgba(224, 86, 36, 0.2)', color: '#ff7a45', fontWeight: 700 }}>
              {table.label}
            </Chip>
          </DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: '#23273c' }} />

          <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {submitError && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <Stack spacing={1.5}>
              {cart.map((item) => {
                const itemImg = getProductImageUrl(item.product);
                return (
                  <Box
                    key={item.product.id}
                    sx={{
                      p: 1.5,
                      bgcolor: '#181b29',
                      borderRadius: '14px',
                      border: '1px solid #282d45'
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {/* Product Thumbnail */}
                      <Box
                        component="img"
                        src={itemImg}
                        alt={item.product.name}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '10px',
                          objectFit: 'cover',
                          bgcolor: '#1f2438',
                          flexShrink: 0
                        }}
                      />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          level="title-sm"
                          sx={{
                            color: '#f4f4f5',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.product.name}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#ff8a4c', fontWeight: 600 }}>
                          ₱{Number(item.product.price).toFixed(2)} × {item.quantity} = ₱{(item.product.price * item.quantity).toFixed(2)}
                        </Typography>
                        {item.notes && (
                          <Typography level="body-xs" sx={{ color: '#8b92ad', fontStyle: 'italic', mt: 0.25 }}>
                            Note: "{item.notes}"
                          </Typography>
                        )}
                      </Box>

                      {/* Stepper controls */}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton
                          size="sm"
                          variant="soft"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          sx={{ bgcolor: '#24283b', color: '#ff7a45', minWidth: 26, minHeight: 26 }}
                        >
                          <Minus size={13} />
                        </IconButton>
                        <Typography level="title-sm" sx={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="sm"
                          variant="soft"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          sx={{ bgcolor: '#24283b', color: '#ff7a45', minWidth: 26, minHeight: 26 }}
                        >
                          <Plus size={13} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => removeFromCart(item.product.id)}
                          sx={{ ml: 0.5 }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            {/* Special Instructions Note */}
            <Box sx={{ mt: 2 }}>
              <Typography level="body-xs" sx={{ color: '#a1a1aa', mb: 0.5, fontWeight: 600 }}>
                Order instructions / allergies (optional):
              </Typography>
              <Textarea
                placeholder="e.g. Please bring glasses with ice..."
                minRows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                sx={{
                  bgcolor: '#181b29',
                  borderColor: '#282d45',
                  color: '#f4f4f5',
                  fontSize: '0.85rem',
                  borderRadius: '12px'
                }}
              />
            </Box>

            <Divider sx={{ my: 2, borderColor: '#23273c' }} />

            {/* Order Summary */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
                  Subtotal
                </Typography>
                <Typography level="body-sm" sx={{ color: '#f4f4f5', fontWeight: 600 }}>
                  ₱{cartTotal.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
                  Tax / Service Charge
                </Typography>
                <Typography level="body-sm" sx={{ color: '#f4f4f5', fontWeight: 600 }}>
                  Included
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                <Typography level="title-md" sx={{ color: '#f4f4f5', fontWeight: 700 }}>
                  Total Due
                </Typography>
                <Typography level="title-lg" sx={{ color: '#ff7a45', fontWeight: 800 }}>
                  ₱{cartTotal.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>

            {/* Payment at Counter Notice */}
            <Alert
              variant="soft"
              sx={{
                mt: 2,
                bgcolor: 'rgba(234, 179, 8, 0.1)',
                color: '#facc15',
                borderColor: 'rgba(234, 179, 8, 0.2)',
                borderRadius: '12px'
              }}
            >
              <Typography level="body-xs" sx={{ color: '#fde047' }}>
                💡 <strong>Next Step:</strong> After submitting, proceed to the counter to pay (Cash, GCash, or Card)
                with your Order Reference number.
              </Typography>
            </Alert>
          </DialogContent>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setIsCartOpen(false)}
              sx={{ flex: 1, borderColor: '#333852', color: '#a1a1aa', borderRadius: '12px' }}
            >
              Back
            </Button>
            <Button
              variant="solid"
              loading={submitting}
              onClick={handleSubmitOrder}
              sx={{
                flex: 2,
                bgcolor: '#e05624',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '12px',
                '&:hover': { bgcolor: '#c8461b' }
              }}
            >
              Confirm Order
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
};
