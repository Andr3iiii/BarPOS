import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Textarea,
  Stack,
  Divider
} from '@mui/joy';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrl, CATEGORY_FALLBACK_IMAGES } from '../utils/productImages';

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  currentQuantity: number;
  currentNotes?: string;
  onConfirm: (product: Product, quantity: number, notes?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  open,
  onClose,
  currentQuantity,
  currentNotes = '',
  onConfirm
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
      setNotes(currentNotes || '');
      setImgError(false);
    }
  }, [product, currentQuantity, currentNotes]);

  if (!product) return null;

  const imageSrc = imgError
    ? CATEGORY_FALLBACK_IMAGES.default
    : getProductImageUrl(product);

  const handleSave = () => {
    onConfirm(product, quantity, notes.trim() ? notes.trim() : undefined);
    onClose();
  };

  const totalPrice = Number(product.price) * quantity;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: '92vw',
          maxHeight: '90vh',
          p: 0,
          borderRadius: '24px',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          color: 'text.primary',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header / Hero Image */}
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 200, sm: 240 }, bgcolor: 'background.level1' }}>
          <Box
            component="img"
            src={imageSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)'
            }}
          />

          {/* Close Button */}
          <IconButton
            size="sm"
            variant="soft"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 14,
              right: 14,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
            }}
          >
            <X size={18} />
          </IconButton>

          {/* Price Badge on Hero */}
          <Chip
            size="md"
            variant="solid"
            sx={{
              position: 'absolute',
              bottom: 14,
              right: 16,
              bgcolor: 'primary.solidBg',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            ₱{Number(product.price).toFixed(2)}
          </Chip>
        </Box>

        {/* Scrollable Body Content */}
        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.25rem' }}>
            {product.name}
          </Typography>

          {product.description && (
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 1, lineHeight: 1.5 }}>
              {product.description}
            </Typography>
          )}

          <Divider sx={{ my: 2, borderColor: 'divider' }} />

          {/* Special Instructions Note */}
          <Box sx={{ mb: 2 }}>
            <Typography level="title-sm" sx={{ color: 'text.primary', mb: 0.75, fontWeight: 600 }}>
              Special Instructions
            </Typography>
            <Textarea
              placeholder="e.g. Less ice, extra calamansi, well done..."
              minRows={2}
              maxRows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{
                bgcolor: 'background.level1',
                borderColor: 'divider',
                color: 'text.primary',
                fontSize: '0.85rem',
                borderRadius: '12px',
                '&:focus-within': { borderColor: 'primary.500' }
              }}
            />
          </Box>
        </Box>

        {/* Modal Footer / Quantity & Action Button */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.surface',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {/* Stepper */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              bgcolor: 'background.level1',
              borderRadius: '14px',
              p: 0.5,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <IconButton
              size="md"
              variant="plain"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              sx={{ color: 'primary.500', minWidth: 32, minHeight: 32 }}
            >
              <Minus size={18} />
            </IconButton>
            <Typography level="title-md" sx={{ color: 'text.primary', minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
              {quantity}
            </Typography>
            <IconButton
              size="md"
              variant="plain"
              onClick={() => setQuantity((q) => q + 1)}
              sx={{ color: 'primary.500', minWidth: 32, minHeight: 32 }}
            >
              <Plus size={18} />
            </IconButton>
          </Stack>

          {/* Add / Update Button */}
          <Button
            size="lg"
            variant="solid"
            onClick={handleSave}
            startDecorator={<ShoppingBag size={18} />}
            sx={{
              flex: 1,
              bgcolor: 'primary.solidBg',
              color: '#fff',
              borderRadius: '14px',
              fontWeight: 700,
              py: 1.2,
              '&:hover': { bgcolor: 'primary.solidHoverBg' }
            }}
          >
            {currentQuantity > 0 ? 'Update' : 'Add to Order'} • ₱{totalPrice.toFixed(2)}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
};
