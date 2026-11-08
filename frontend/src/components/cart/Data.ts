export const FREE_SHIP_AT = 100;
export const TAX_RATE = 0.08;
export const PROMO = { code: 'ATHLETE10', pct: 0.1 };

export type CartItem = { id: string; name: string; meta: string; stock: string; price: number; qty: number; src: string };

export const initialItems: CartItem[] = [
  { id: 'tee', name: 'MOVE Compression Tee', meta: 'Size: M · Color: Stealth Onyx', stock: '18 in stock', price: 35, qty: 1, src: '/images/combo-tee.jpg' },
  { id: 'shorts', name: 'MOVE Training Shorts', meta: 'Size: L · Color: Matte Black', stock: '12 in stock', price: 40, qty: 1, src: '/images/combo-shorts.jpg' },
];

export const steps = ['Bag & review', 'Athlete details', 'Payment & dispatch', 'Confirmation'];

export const shippingMethods = [
  { id: 'standard', title: 'Standard Athlete', sub: '3–5 business days', note: 'Full global tracking included', price: 0 },
  { id: 'priority', title: 'Volt Priority', sub: 'Next day delivery', note: 'Dispatched within 2 hours', price: 85 },
];

export const payMethods = ['Stripe card', 'Apple Pay', 'Google Pay', 'Klarna Pay'];

export const guarantees = [
  '60-day fit test guarantee. Try it through hard, full reps.',
  'Instant size exchange for a no-questions-asked swap.',
  'Encrypted dispatch. Secured through 256-bit encryption.',
];

export const paired = [
  { id: 'hoodie', tag: 'Winter drop', name: 'MOVE Oversized Hoodie', note: 'Heavyweight fleece, brushed inside, drop-shoulder cut.', price: 65, src: '/images/paired-hoodie.jpg' },
  { id: 'duffel', tag: 'Top rated', name: 'Ballistic Gym Duffel 35L', note: 'Weatherproof ballistic shell with ventilated shoe tunnel.', price: 55, src: '/images/paired-duffel.jpg' },
  { id: 'straps', tag: 'Recovery pick', name: 'Kinetic Lifting Straps + Shaker', note: 'Padded cotton straps with a leak-proof 700ml shaker.', price: 28, src: '/images/paired-straps.jpg' },
];