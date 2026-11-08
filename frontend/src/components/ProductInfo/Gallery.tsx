import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Heart } from 'lucide-react';
import { LIME, product } from './Data';
import { Frame, cut, dots } from './Ui';
import { useCartStore } from '../../stores/cartStore';

const pad = (n: number) => String(n).padStart(2, '0');

export default function Gallery({ productId }: { productId: number }) {
  const [active, setActive] = useState(0);
  const zoomRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);

  // Wishlist is the shared store, so it matches the product grid and favourites page
  const liked = useCartStore((s) => s.favourites.includes(productId));
  const toggleFavourite = useCartStore((s) => s.toggleFavourite);

  const total = product.images.length;
  const canHover = () => window.matchMedia('(hover: hover)').matches;

  const zoom = (e: React.MouseEvent) => {
    if (!canHover() || !frameRef.current) return;
    const r = frameRef.current.getBoundingClientRect();
    gsap.to(zoomRef.current, {
      scale: 1.7,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
      transformOrigin: `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
    });
  };
  const resetZoom = () => gsap.to(zoomRef.current, { scale: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });

  const like = () => {
    toggleFavourite(productId);
    gsap.fromTo(heartRef.current, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* THUMBNAILS */}
      <div className="flex gap-3 md:w-20 md:flex-col">
        {product.images.map((im, i) => (
          <button
            key={im.label}
            onClick={() => setActive(i)}
            aria-label={`Show ${im.label} view`}
            aria-current={i === active}
            className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-[#161616] transition-opacity md:w-full ${
              i === active ? '' : 'opacity-60 hover:opacity-100'
            }`}
            style={{ clipPath: cut(12) }}
          >
            <img
              src={im.src}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 border-2 transition-colors"
              style={{ borderColor: i === active ? LIME : 'transparent' }}
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[8px] font-bold uppercase tracking-widest text-white">
              {im.label}
            </span>
          </button>
        ))}
      </div>

      {/* MAIN IMAGE */}
      <Frame size={34} className="flex-1" innerClassName="p-0">
        <div
          ref={frameRef}
          onMouseMove={zoom}
          onMouseLeave={resetZoom}
          className="relative aspect-[4/5] cursor-zoom-in overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 100%, ${LIME}26, transparent 60%), linear-gradient(#1d1d1d, #0b0b0b)`,
          }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={dots(16)} />

          <div ref={zoomRef} className="absolute inset-0 will-change-transform">
            {product.images.map((im, i) => (
              <img
                key={im.label}
                src={im.src}
                alt={i === active ? `${product.name} – ${im.label}` : ''}
                aria-hidden={i !== active}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  i === active ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => (e.currentTarget.style.opacity = '0')}
              />
            ))}
          </div>

          <button
            onClick={like}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={liked}
            className="absolute right-12 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm transition hover:border-white/50"
          >
            <Heart
              ref={heartRef}
              className="h-4 w-4"
              fill={liked ? LIME : 'none'}
              stroke={liked ? LIME : '#fff'}
            />
          </button>

          {/* counter, same style as the hero pagination */}
          <div className="font-display pointer-events-none absolute bottom-4 left-5 flex items-center gap-3 text-white">
            <span className="text-xl font-black italic">{pad(active + 1)}</span>
            <span className="relative block h-px w-14 bg-white/30">
              <span
                className="absolute inset-y-0 left-0 block transition-all duration-500"
                style={{ width: `${((active + 1) / total) * 100}%`, background: LIME }}
              />
            </span>
            <span className="text-xs font-medium text-white/50">{pad(total)}</span>
          </div>
        </div>
      </Frame>
    </div>
  );
}