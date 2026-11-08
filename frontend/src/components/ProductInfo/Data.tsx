export const LIME = '#C8F31D';
export const INK = '#171914';

export const product = {
  name: 'MOVE Compression Tee',
  rating: 4.8,
  reviews: 342,
  price: 35,
  was: 45,
  desc: 'High-density, second-skin bi-clinical tee engineered for lactic-threshold training, micro-circulation acceleration, and full range mobility.',
  colors: [
    { name: 'Stealth Onyx', hex: '#171914' },
    { name: 'Volt', hex: '#C8F31D' },
    { name: 'Graphite', hex: '#4b4d49' },
    { name: 'Chalk', hex: '#ffffff' },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  levels: [
    { label: 'Level 1', note: 'Light recovery' },
    { label: 'Level 2', note: 'Active flex' },
    { label: 'Level 3', note: 'Mid muscle stabilization' },
    { label: 'Level 4', note: 'Max support' },
  ],
  // Swap these for your real images in /public/images
  images: [
    { label: 'Front', src: '/images/tee-front.jpg' },
    { label: 'Side', src: '/images/tee-side.jpg' },
    { label: 'Detail', src: '/images/tee-detail.jpg' },
    { label: 'Back', src: '/images/tee-back.jpg' },
  ],
  accordions: [
    { title: 'Fabric architecture & SilverTech™ specs', body: '78% recycled polyamide, 22% elastane. 190 GSM, bonded flatlock seams, silver-ion antimicrobial finish. Machine wash cold.' },
    { title: 'Worldwide dispatch & hassle-free returns', body: 'Ships in 24h from our fulfilment hub. Free returns within 30 days, worn or not.' },
  ],
};

export const features = [
  { icon: 'stretch', title: '4-Way Hyperstretch', text: 'Unmatched fiber orientation yields instant shape-memory without bunching or collar deformation during explosive lifts.', stat: 'Shape recovery', value: '99% Flex' },
  { icon: 'wind', title: 'AeroDry™ Vents', text: 'Strategically zoned micro-pore mesh keeps spinal and armpit zones channels evaporative airflow far less than conventional.', stat: 'Evaporation rate', value: '3.8x Faster' },
  { icon: 'shield', title: 'SilverTech™ Defense', text: 'Permanent molecular antimicrobial infusion halts olfactory odor build-up even across back-to-back sessions.', stat: 'Bacterial reduction', value: '99.9% Effective' },
  { icon: 'scissors', title: 'Zero-Chafe Seams', text: 'Low-profile bonded flatlock seam engineering eliminates epidermal friction and skin abrasions on maximum training days.', stat: 'Seam height', value: '0.4mm Bonded' },
];

export const combo = [
  { name: 'MOVE Compression Tee', note: 'Included', price: 35, src: '/images/men-gymwear.png', locked: true },
  { name: 'MOVE Training Shorts', note: 'Built-in moisture-wicking liner, 7 inch inseam', price: 40, src: '/images/men-gymwear.png' },
  { name: 'Pro Heavy Duffel 45L', note: 'Built to endure season with our gear expansion', price: 70, src: '/images/men-gymwear.png' },
];

export const stats = [
  { label: 'Compression', pct: 98, tag: 'Strong' },
  { label: 'Breathability', pct: 96, tag: 'Optimal' },
  { label: 'True to size', pct: 94, tag: 'Accurate' },
];

export const reviewList = [
  { name: 'Marcus V.', role: 'CrossFit Competitor', when: '5 days ago', title: 'Locks the upper body in without choking the chest or shoulders.', body: 'Hands down the best compression at this price. No ride-up even when soaked, and the SilverTech finish means it still smells fresh after two back-to-back sessions.' },
  { name: 'Elena R.', role: 'Track & Field Coach', when: '1 week ago', title: 'The back venting channels actually work.', body: 'Noticeable temperature drop across the spine compared to my typical compression gear. The flatlock stitching causes zero chafing over 15 mile runs.' },
];