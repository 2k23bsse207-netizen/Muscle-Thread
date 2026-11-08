export type Category = 'Men' | 'Women' | 'Accessories'

export type ProductItem = {
  id: number
  name: string
  category: Category
  collection: string
  price: number
  image: string
  badge?: string
  colors: string[]
  featured?: boolean
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 1,
    name: 'MOVE Compression Tee',
    category: 'Men',
    collection: 'Compression 01',
    price: 35,
    image: '/images/men-gymwear.png',
    badge: 'Best Seller',
    colors: ['#171717', '#777777', '#d8d5ce'],
    featured: true,
  },
  {
    id: 2,
    name: 'MOVE Training Shorts',
    category: 'Men',
    collection: 'Aero Hybrid',
    price: 40,
    image: '/images/men-gymwear.png',
    colors: ['#171717', '#777777', '#c9d52d'],
    featured: true,
  },
  {
    id: 3,
    name: 'MOVE Oversized Hoodie',
    category: 'Men',
    collection: 'Heavyweight 460GSM',
    price: 65,
    image: '/images/men-gymwear.png',
    badge: 'New',
    colors: ['#171717', '#777777'],
    featured: true,
  },
  {
    id: 4,
    name: 'MOVE Seamless Sports Bra',
    category: 'Women',
    collection: 'Seamless Impact',
    price: 38,
    image: '/images/new-arrivals.png',
    colors: ['#555555', '#171717', '#d8d5ce'],
    featured: true,
  },
  {
    id: 5,
    name: 'MOVE Performance Leggings',
    category: 'Women',
    collection: 'Sculpt Series',
    price: 48,
    image: '/images/new-arrivals.png',
    badge: 'Popular',
    colors: ['#171717', '#777777', '#8b8179'],
  },
  {
    id: 6,
    name: 'MOVE Performance Tank',
    category: 'Women',
    collection: 'Essential Training',
    price: 32,
    image: '/images/new-arrivals.png',
    colors: ['#171717', '#d8d5ce'],
  },
  {
    id: 7,
    name: 'MOVE Training Duffel',
    category: 'Accessories',
    collection: 'Everyday Carry',
    price: 55,
    image: '/images/new-arrivals.png',
    badge: 'New',
    colors: ['#171717', '#777777'],
  },
  {
    id: 8,
    name: 'MOVE Training Cap',
    category: 'Accessories',
    collection: 'Performance Essentials',
    price: 25,
    image: '/images/new-arrivals.png',
    colors: ['#171717', '#d8d5ce', '#777777'],
  },
  {
    id: 9,
    name: 'MOVE Essential Tee',
    category: 'Men',
    collection: 'Everyday Performance',
    price: 30,
    image: '/images/men-gymwear.png',
    colors: ['#171717', '#777777'],
  },
  {
    id: 10,
    name: 'MOVE Sculpt Leggings',
    category: 'Women',
    collection: 'Sculpt Series',
    price: 52,
    image: '/images/new-arrivals.png',
    badge: 'Best Seller',
    colors: ['#171717', '#777777'],
  },
  {
    id: 11,
    name: 'MOVE Gym Gloves',
    category: 'Accessories',
    collection: 'Training Gear',
    price: 22,
    image: '/images/new-arrivals.png',
    colors: ['#171717', '#777777'],
  },
  {
    id: 12,
    name: 'MOVE Zip Training Jacket',
    category: 'Men',
    collection: 'Performance Layer',
    price: 72,
    image: '/images/men-gymwear.png',
    badge: 'New',
    colors: ['#171717', '#777777'],
  },
]

export const CATEGORIES = ['All Products', 'Men', 'Women', 'Accessories'] as const

export const PRODUCTS_PER_PAGE = 8