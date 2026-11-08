export type Status = 'Active' | 'Draft' | 'Archived';
export type Product = {
  sku: string; name: string; category: string; drop: string[]; price: number; msrp?: number; sale?: string;
  sizes: string[]; colors: string[]; units: number; warehouse: string; status: Status; tag?: string; src: string;
};

export const products: Product[] = [
  { sku: 'MV-APX-01', name: 'Apex Kinetic Compression Tee', category: "Men's Active", drop: ['Drop 04', 'Velocity'], price: 38, msrp: 48, sale: '20% sale', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['#171914', '#C8F31D', '#5a5d66'], units: 412, warehouse: 'WH-Seattle', status: 'Active', tag: 'Featured', src: '/images/apex.jpg' },
  { sku: 'MV-SHR-07', name: 'AeroFlex 7" Training Shorts', category: "Men's Active", drop: ['Core', 'Performance'], price: 54, sizes: ['S', 'M', 'L', 'XL'], colors: ['#171914', '#33362f'], units: 9, warehouse: 'WH-Seattle', status: 'Active', tag: 'Bestseller', src: '/images/shorts.jpg' },
  { sku: 'MV-HOD-88', name: 'Thermal Shift Oversized Hoodie', category: 'Outerwear', drop: ['Drop 04', 'Velocity'], price: 110, sizes: ['M', 'L', 'XL', 'XXL'], colors: ['#d8d5cc', '#171914'], units: 184, warehouse: 'WH-Austin', status: 'Draft', tag: 'New arrival', src: '/images/hoodie.jpg' },
  { sku: 'MV-WBR-14', name: 'Seamless Contour Sports Bra', category: "Women's Lab", drop: ['Kinetic', 'Core'], price: 42, sizes: ['XS', 'S', 'M', 'L'], colors: ['#7a7d62', '#C8F31D', '#171914'], units: 520, warehouse: 'WH-Seattle', status: 'Active', tag: 'Featured', src: '/images/bra.jpg' },
  { sku: 'MV-ACC-DUF', name: 'Utility Tactical Duffel 45L', category: 'Accessories', drop: ['Equipment', 'V2'], price: 128, sizes: ['One size'], colors: ['#171914'], units: 64, warehouse: 'WH-Rotterdam', status: 'Active', tag: 'Bestseller', src: '/images/duffel.jpg' },
  { sku: 'MV-JKT-09', name: 'HydroShield Windbreaker', category: 'Outerwear', drop: ['Drop 04', 'Velocity'], price: 160, sizes: ['S', 'M', 'L', 'XL'], colors: ['#C8F31D', '#171914'], units: 0, warehouse: '', status: 'Archived', src: '/images/windbreaker.jpg' },
];

export const LOW_STOCK_AT = 10;
export const categories = ['All', "Men's Active", "Women's Lab", 'Outerwear', 'Accessories'];
export const statuses = ['All', 'Active', 'Draft', 'Archived'];
export const tags = ['Any', 'Featured', 'Bestseller', 'New arrival'];
export const prices = ['All', 'Under $50', '$50 – $100', 'Over $100'];
export const PAGE_SIZE = 6;

export type Filters = {
  q: string;
  category: string;
  status: string;
  tag: string;
  price: string;
};

export const emptyFilters: Filters = {
  q: '',
  category: 'All',
  status: 'All',
  tag: 'Any',
  price: 'All',
};
