// Demo data fallback when Supabase is not configured
export const demoProducts = [
  {
    id: '1',
    name: "Aros Luna de Acero",
    price: 25.00,
    cover_image: "https://picsum.photos/400/600?v=1",
    product_images: ["https://picsum.photos/400/600?v=1", "https://picsum.photos/400/600?v=11"],
    category_id: '1',
    subcategory_id: '1',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: "Collar Sol Dorado",
    price: 45.00,
    cover_image: "https://picsum.photos/400/600?v=2",
    product_images: ["https://picsum.photos/400/600?v=2", "https://picsum.photos/400/600?v=12"],
    category_id: '2',
    subcategory_id: '2',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: "Anillo Estrella Plata",
    price: 35.00,
    cover_image: "https://picsum.photos/400/600?v=3",
    product_images: ["https://picsum.photos/400/600?v=3", "https://picsum.photos/400/600?v=13"],
    category_id: '3',
    subcategory_id: '3',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: "Pulsera Infinity Acero",
    price: 40.00,
    cover_image: "https://picsum.photos/400/600?v=4",
    product_images: ["https://picsum.photos/400/600?v=4", "https://picsum.photos/400/600?v=14"],
    category_id: '4',
    subcategory_id: '1',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: "Aros Gota Elegantes",
    price: 28.00,
    cover_image: "https://picsum.photos/400/600?v=5",
    product_images: ["https://picsum.photos/400/600?v=5", "https://picsum.photos/400/600?v=15"],
    category_id: '1',
    subcategory_id: '2',
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    name: "Collar Corazón Plata",
    price: 52.00,
    cover_image: "https://picsum.photos/400/600?v=6",
    product_images: ["https://picsum.photos/400/600?v=6", "https://picsum.photos/400/600?v=16"],
    category_id: '2',
    subcategory_id: '3',
    created_at: new Date().toISOString()
  }
];

export const demoCategories = [
  { id: '1', name: 'aros' },
  { id: '2', name: 'collares' },
  { id: '3', name: 'anillos' },
  { id: '4', name: 'pulseras' }
];

export const demoSubcategories = [
  { id: '1', name: 'Acero quirúrgico' },
  { id: '2', name: 'dorado' },
  { id: '3', name: 'Plata 925' },
  { id: '4', name: 'blanco' }
];