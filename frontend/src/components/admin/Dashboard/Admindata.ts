export const ranges = ['7D', '30D', '90D'] as const;
export type Range = (typeof ranges)[number];

// Demo series, replace with API data
export const revenue: Record<Range, number[]> = Object.fromEntries(
  ([['7D', 7], ['30D', 30], ['90D', 45]] as const).map(([k, n]) => [
    k, Array.from({ length: n }, (_, i) => Math.round(3200 + 1500 * Math.sin(i / (n / 6)) + (i * 2400) / n)),
  ])
) as Record<Range, number[]>;

export const topSellers = [
  { name: 'Apex Kinetic Compression Tee', units: 412 }, { name: 'AeroFlex 7" Training Shorts', units: 338 },
  { name: 'Seamless Contour Sports Bra', units: 296 }, { name: 'Utility Tactical Duffel 45L', units: 171 },
];

export const orders = [
  { id: '#MV-10482', who: 'Marcus Vale', items: 3, total: 146.5, status: 'Paid' },
  { id: '#MV-10481', who: 'Elena Ruiz', items: 1, total: 42, status: 'Packing' },
  { id: '#MV-10480', who: 'Jonah Pike', items: 2, total: 98, status: 'Shipped' },
  { id: '#MV-10479', who: 'Priya Nair', items: 4, total: 212.8, status: 'Paid' },
  { id: '#MV-10478', who: 'Sam Okafor', items: 1, total: 54, status: 'Refunded' },
];

export const lowStock = [
  { name: 'AeroFlex 7" Training Shorts', sku: 'MV-SHR-07', left: 9 },
  { name: 'Utility Tactical Duffel 45L', sku: 'MV-ACC-DUF', left: 6 },
  { name: 'Thermal Shift Hoodie', sku: 'MV-HOD-88', left: 4 },
];

export type Promo = { code: string; type: 'Percent' | 'Fixed' | 'Free shipping'; value: number; used: number; limit: number; ends: string; status: 'Active' | 'Paused' | 'Scheduled' | 'Expired' };
export const promos: Promo[] = [
  { code: 'ATHLETE10', type: 'Percent', value: 10, used: 842, limit: 2000, ends: '2026-12-31', status: 'Active' },
  { code: 'VOLTSHIP', type: 'Free shipping', value: 0, used: 311, limit: 1000, ends: '2026-12-15', status: 'Active' },
  { code: 'DROP04-15', type: 'Percent', value: 15, used: 0, limit: 500, ends: '2027-01-10', status: 'Scheduled' },
  { code: 'WELCOME20', type: 'Fixed', value: 20, used: 129, limit: 300, ends: '2026-11-30', status: 'Paused' },
  { code: 'BLACKOUT', type: 'Percent', value: 25, used: 500, limit: 500, ends: '2026-10-31', status: 'Expired' },
];