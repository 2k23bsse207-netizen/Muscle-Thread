import { Link, useNavigate } from "react-router-dom";
import Cartitems from "../components/cart/Cartitems";
import type { CartItem } from "../components/cart/Data";
import { useCartStore } from "../stores/cartStore";

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();

  // Map store lines onto the cart-row shape the shared Cartitems view expects.
  const lines: CartItem[] = items.map((i) => ({
    id: i.key,
    name: i.name,
    meta: i.meta,
    stock: "In stock",
    price: i.price,
    qty: i.qty,
    src: i.image,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  // The ProtectedRoute guard handles guests: it redirects to /login and
  // brings them back here (to /checkout) after signing in.
  const checkout = () => navigate("/checkout");

  return (
    <main className="bg-[#F7F4EE] px-6 pb-20 pt-28 text-[#171914]">
      <div className="mx-auto max-w-[1280px]">
        <nav className="text-[10px] font-bold uppercase tracking-widest text-[#171914]/50">
          Home / <span className="text-[#171914]">Bag</span>
        </nav>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[#171914]/10 pb-8">
          <h1 className="font-display text-5xl font-black uppercase italic leading-[0.85] tracking-tight md:text-6xl">
            Your bag
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#171914]/50">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <Cartitems
            items={lines}
            onQty={(id, delta) => setQty(id, delta)}
            onRemove={removeItem}
          />

          <aside className="border border-[#171914]/10 bg-white p-6">
            <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
              Order summary
            </h2>

            <div className="mt-5 flex items-center justify-between border-b border-[#171914]/10 pb-4 text-sm">
              <span className="text-[#171914]/60">Subtotal</span>
              <span className="font-black">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-4 text-sm">
              <span className="text-[#171914]/60">Shipping</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Calculated at checkout
              </span>
            </div>

            <button
              onClick={checkout}
              disabled={!items.length}
              className="mt-6 w-full bg-[#171914] px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Proceed to checkout
            </button>

            <Link
              to="/shop"
              className="mt-3 block text-center text-[10px] font-bold uppercase tracking-wider text-[#171914]/60 underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>

            {!items.length && (
              <p className="mt-4 text-center text-xs text-[#171914]/50">
                Your bag is empty — add some gear first.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
