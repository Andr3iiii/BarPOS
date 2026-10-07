import { Product } from '../types';

// High-definition curated photography for fallback & presets
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  beer: 'https://images.unsplash.com/photo-1608270199180-29177e7f6e4d?auto=format&fit=crop&w=600&q=80',
  wine: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
  cocktail: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  spirits: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80',
  food: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  bites: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
  soft_drinks: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80'
};

export function getProductImageUrl(product: Product): string {
  if (product.image_url && product.image_url.trim() !== '') {
    return product.image_url;
  }

  // Derive fallback based on name or category_id
  const name = product.name.toLowerCase();
  if (name.includes('beer') || name.includes('pilsen') || name.includes('lager') || name.includes('ipa') || name.includes('heineken') || name.includes('corona')) {
    return CATEGORY_FALLBACK_IMAGES.beer;
  }
  if (name.includes('margarita') || name.includes('mojito') || name.includes('martini') || name.includes('fashioned') || name.includes('sour') || name.includes('cocktail')) {
    return CATEGORY_FALLBACK_IMAGES.cocktail;
  }
  if (name.includes('shot') || name.includes('whiskey') || name.includes('tequila') || name.includes('scotch') || name.includes('j\u00e4ger')) {
    return CATEGORY_FALLBACK_IMAGES.spirits;
  }
  if (name.includes('fries') || name.includes('wings') || name.includes('sisig') || name.includes('nachos') || name.includes('gambas')) {
    return CATEGORY_FALLBACK_IMAGES.bites;
  }
  if (name.includes('burger') || name.includes('pizza') || name.includes('ribs') || name.includes('steak')) {
    return CATEGORY_FALLBACK_IMAGES.food;
  }
  if (name.includes('tea') || name.includes('red bull') || name.includes('water') || name.includes('juice') || name.includes('virgin')) {
    return CATEGORY_FALLBACK_IMAGES.soft_drinks;
  }

  // Match by category_id
  switch (product.category_id) {
    case 1:
      return CATEGORY_FALLBACK_IMAGES.beer;
    case 2:
      return CATEGORY_FALLBACK_IMAGES.cocktail;
    case 3:
      return CATEGORY_FALLBACK_IMAGES.spirits;
    case 4:
      return CATEGORY_FALLBACK_IMAGES.bites;
    case 5:
      return CATEGORY_FALLBACK_IMAGES.food;
    case 6:
      return CATEGORY_FALLBACK_IMAGES.soft_drinks;
    default:
      return CATEGORY_FALLBACK_IMAGES.default;
  }
}
