import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Chip,
  Stack
} from '@mui/joy';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrl, CATEGORY_FALLBACK_IMAGES } from '../utils/productImages';

interface ProductGridCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: number, delta: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails
}) => {
  const [imgError, setImgError] = useState(false);
  const initialUrl = getProductImageUrl(product);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
    }
  };

  const imageSrc = imgError ? CATEGORY_FALLBACK_IMAGES.default : initialUrl;

  return (
    <Card
      variant="outlined"
      onClick={() => onOpenDetails(product)}
      sx={{
        cursor: 'pointer',
        bgcolor: '#12141f',
        borderColor: quantityInCart > 0 ? 'rgba(224, 86, 36, 0.6)' : '#222638',
        boxShadow: quantityInCart > 0 ? '0 0 16px rgba(224, 86, 36, 0.2)' : '0 4px 14px rgba(0,0,0,0.25)',
        p: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: quantityInCart > 0 ? '#e05624' : '#394060',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
        }
      }}
    >
      {/* Product Image Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          bgcolor: '#191d2d',
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
            '&:hover': {
              transform: 'scale(1.06)'
            }
          }}
        />

        {/* Gradient shadow overlay for contrast */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(18, 20, 31, 0.75) 0%, transparent 60%)',
            pointerEvents: 'none'
          }}
        />

        {/* In-cart indicator badge */}
        {quantityInCart > 0 && (
          <Chip
            size="sm"
            variant="solid"
            color="primary"
            startDecorator={<ShoppingBag size={12} />}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: '#e05624',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.7rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              px: 1
            }}
          >
            {quantityInCart} in cart
          </Chip>
        )}
      </Box>

      {/* Card Content Details */}
      <Box
        sx={{
          p: { xs: 1.25, sm: 1.75 },
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography
            level="title-sm"
            sx={{
              color: '#f4f4f5',
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: { xs: '2.1rem', sm: '2.4rem' }
            }}
          >
            {product.name}
          </Typography>

          {product.description && (
            <Typography
              level="body-xs"
              sx={{
                color: '#8b92ad',
                mt: 0.5,
                lineHeight: 1.3,
                fontSize: { xs: '0.7rem', sm: '0.78rem' },
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: { xs: '1.8rem', sm: '2rem' }
              }}
            >
              {product.description}
            </Typography>
          )}
        </Box>

        {/* Bottom Price & Add Action */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1.5, pt: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography
            level="title-md"
            sx={{
              color: '#ff8a4c',
              fontWeight: 800,
              fontSize: { xs: '0.92rem', sm: '1.05rem' },
              letterSpacing: '0.01em'
            }}
          >
            ₱{Number(product.price).toFixed(2)}
          </Typography>

          {/* Stepper if in cart, or "+ Add" button */}
          {quantityInCart > 0 ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                bgcolor: '#1d2133',
                borderRadius: '10px',
                p: 0.25,
                border: '1px solid #323854'
              }}
            >
              <IconButton
                size="sm"
                variant="plain"
                onClick={() => onUpdateQuantity(product.id, -1)}
                sx={{
                  color: '#ff7a45',
                  minWidth: { xs: 24, sm: 28 },
                  minHeight: { xs: 24, sm: 28 },
                  p: 0
                }}
              >
                <Minus size={14} />
              </IconButton>
              <Typography
                level="title-sm"
                sx={{
                  color: '#fff',
                  minWidth: 18,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                {quantityInCart}
              </Typography>
              <IconButton
                size="sm"
                variant="plain"
                onClick={() => onUpdateQuantity(product.id, 1)}
                sx={{
                  color: '#ff7a45',
                  minWidth: { xs: 24, sm: 28 },
                  minHeight: { xs: 24, sm: 28 },
                  p: 0
                }}
              >
                <Plus size={14} />
              </IconButton>
            </Stack>
          ) : (
            <Button
              size="sm"
              variant="solid"
              onClick={() => onAddToCart(product)}
              startDecorator={<Plus size={15} />}
              sx={{
                bgcolor: '#e05624',
                color: '#fff',
                borderRadius: '10px',
                px: { xs: 1.25, sm: 1.75 },
                py: { xs: 0.4, sm: 0.6 },
                fontSize: { xs: '0.78rem', sm: '0.85rem' },
                fontWeight: 600,
                minHeight: { xs: 28, sm: 32 },
                '&:hover': { bgcolor: '#c8461b' }
              }}
            >
              Add
            </Button>
          )}
        </Stack>
      </Box>
    </Card>
  );
};
