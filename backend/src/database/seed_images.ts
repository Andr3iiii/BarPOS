import { query } from './db.js';

export const PRODUCT_IMAGES: Record<string, string> = {
  'San Miguel Pale Pilsen': 'https://images.unsplash.com/photo-1608270199180-29177e7f6e4d?auto=format&fit=crop&w=600&q=80',
  'San Miguel Light': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
  'Red Horse Beer': 'https://images.unsplash.com/photo-1618886614638-80e3c15cd819?auto=format&fit=crop&w=600&q=80',
  'Heineken Draft': 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=600&q=80',
  'Corona Extra with Lime': 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=600&q=80',
  'Craft IPA (Local Brew)': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80',

  'Smoked Old Fashioned': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
  'Classic Margarita': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  'Espresso Martini': 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=600&q=80',
  'Neon Tide Mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80',
  'Whiskey Sour': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
  'Gin & Tonic Highball': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',

  'Tequila Ocho Shot': 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=600&q=80',
  'Jägermeister Shot': 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=600&q=80',
  'Jameson Irish Whiskey Neat': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80',
  'Johnny Walker Black Label': 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80',

  'Truffle Parmesan Fries': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
  'Spicy Buffalo Wings (6pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
  'Crispy Pork Sisig': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  'Loaded Nachos Grande': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
  'Gambas al Ajillo': 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80',

  'Double Cheeseburger & Fries': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'Wood-Fired Pepperoni Pizza': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
  'Smoked BBQ Ribs Half-Rack': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',

  'Calamansi Iced Tea Pitcher': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
  'Red Bull Energy Drink': 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80',
  'San Pellegrino Sparkling Water': 'https://images.unsplash.com/photo-1560508180-03f285f67dd9?auto=format&fit=crop&w=600&q=80',
  'Craft Virgin Mojito': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
};

export async function seedProductImages() {
  console.log('📸 Updating product images...');
  for (const [name, url] of Object.entries(PRODUCT_IMAGES)) {
    const res = await query(
      'UPDATE products SET image_url = $1 WHERE name ILIKE $2',
      [url, `%${name}%`]
    );
    console.log(`Updated ${name} -> ${res.rowCount} row(s)`);
  }
  console.log('✅ All product images populated successfully!');
}

if (require.main === module) {
  seedProductImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
