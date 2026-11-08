import { useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import Gallery from "./Gallery";
import ProductInfo from "./ProductInfo";
import Features from "./Features";
import Combo from "./Combo";
import Reviews from "./Reviews";
import { dots } from "./Ui";
import { LIME, product } from "./Data";
import { useCartStore } from "../../stores/cartStore";

// Catalog id 1 = this tee, so cart/favourites lines match the product grid.
const PRODUCT_ID = 1;

export default function ProductPage() {
  const heroRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const addToCart = (item: { color: string; size: string }) =>
    addItem({
      key: `${PRODUCT_ID}-${item.color}-${item.size}`,
      id: PRODUCT_ID,
      name: product.name,
      price: product.price,
      image: product.images[0].src,
      meta: `${item.color} · ${item.size}`,
      qty: 1,
    });

  const buyNow = (item: { color: string; size: string }) => {
    addToCart(item);
    navigate("/cart");
  };

  // One orchestrated entrance for the hero only
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".crumbs", { opacity: 0, y: -10, duration: 0.4 })
        .from(".gallery-col", { opacity: 0, x: -40, duration: 0.8 }, 0.1)
        .from(".info-col", { opacity: 0, x: 40, duration: 0.8 }, 0.1);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <main className="relative overflow-hidden bg-black text-white">
      {/* backdrop: same dot grid + neon glow as the hero artwork */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[900px]">
        <div
          className="absolute inset-0"
          style={{
            ...dots(22, 0.2),
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 30% 35%, #000, transparent 100%)",
            maskImage: "radial-gradient(ellipse 70% 60% at 30% 35%, #000, transparent 100%)",
          }}
        />
        <div
          className="absolute -left-40 top-20 h-[460px] w-[460px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: LIME }}
        />
      </div>

      <section ref={heroRef} className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-28 sm:pt-32">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="crumbs flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
            <li>
              <Link to="/" className="transition-colors hover:text-white">Home</Link>
            </li>
            <li aria-hidden="true" style={{ color: LIME }}>/</li>
            <li>Men</li>
            <li aria-hidden="true" style={{ color: LIME }}>/</li>
            <li>Tops</li>
            <li aria-hidden="true" style={{ color: LIME }}>/</li>
            <li aria-current="page" className="text-white">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="gallery-col lg:sticky lg:top-6 lg:self-start">
            <Gallery productId={PRODUCT_ID} />
          </div>
          <div className="info-col">
            <ProductInfo onAdd={addToCart} onBuyNow={buyNow} />
          </div>
        </div>
      </section>

      <Features />
      <Combo />
      <Reviews />
    </main>
  );
}