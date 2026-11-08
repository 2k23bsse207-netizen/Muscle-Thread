import { useRef } from 'react';
import { gsap } from 'gsap';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartItem } from './Data';
import { LIME } from '../theme';
import { Panel, cut } from './Field';

type RowProps = {
  item: CartItem;
  onQty: (id: string, d: number) => void;
  onRemove: (id: string) => void;
};

const qtyBtn =
  'grid h-9 w-9 place-items-center text-white transition-colors hover:bg-[var(--lime)] hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white';

function Row({ item, onQty, onRemove }: RowProps) {
  const ref = useRef<HTMLLIElement>(null);

  const remove = () =>
    gsap.to(ref.current, {
      height: 0,
      opacity: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.4,
      ease: 'power3.inOut',
      onComplete: () => onRemove(item.id),
    });

  const bump = (d: number) => {
    onQty(item.id, d);
    const qty = ref.current?.querySelector('.qty');
    if (qty) gsap.fromTo(qty, { y: d > 0 ? -6 : 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
  };

  return (
    <li
      ref={ref}
      className="group flex gap-4 overflow-hidden border border-white/10 bg-white/[0.03] p-3 transition-colors duration-300 hover:border-white/25 sm:gap-5 sm:p-4"
    >
      <div
        className="h-28 w-24 shrink-0 overflow-hidden bg-[#161616] sm:h-32 sm:w-28"
        style={{ clipPath: cut(14) }}
      >
        <img
          src={item.src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-lg font-black uppercase italic tracking-tight text-white">
              {item.name}
            </h3>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {item.meta}
              <span className="mx-1.5" style={{ color: LIME }}>//</span>
              {item.stock}
            </p>
          </div>
          <span className="font-display shrink-0 text-2xl font-black italic leading-none text-white">
            <span className="mr-0.5 align-top text-xs" style={{ color: LIME }}>$</span>
            {(item.price * item.qty).toFixed(2)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div
            className="flex -skew-x-12 items-center border border-white/20 transition-colors focus-within:border-white/60"
            style={{ '--lime': LIME } as React.CSSProperties}
          >
            <button aria-label="Decrease quantity" onClick={() => bump(-1)} disabled={item.qty <= 1} className={qtyBtn}>
              <Minus className="h-3 w-3 skew-x-12" />
            </button>
            <span className="qty w-8 skew-x-12 text-center text-xs font-black tabular-nums text-white">{item.qty}</span>
            <button aria-label="Increase quantity" onClick={() => bump(1)} className={qtyBtn}>
              <Plus className="h-3 w-3 skew-x-12" />
            </button>
          </div>

          <button
            onClick={remove}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 transition-colors hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

type Props = {
  items: CartItem[];
  onQty: (id: string, d: number) => void;
  onRemove: (id: string) => void;
};

export default function CartItems({ items, onQty, onRemove }: Props) {
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <Panel title="Selected gear" index="01" tag={`Bag · ${String(count).padStart(2, '0')} items`}>
      {items.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((i) => (
            <Row key={i.id} item={i} onQty={onQty} onRemove={onRemove} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <ShoppingBag className="h-8 w-8 text-white/30" />
          <p className="text-sm text-white/60">Your bag is empty.</p>
          <a
            href="#paired-gear"
            className="-skew-x-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:brightness-110"
            style={{ background: LIME }}
          >
            <span className="block skew-x-12">Browse picks below</span>
          </a>
        </div>
      )}
    </Panel>
  );
}