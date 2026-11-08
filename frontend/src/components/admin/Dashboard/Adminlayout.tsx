import { useState, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Bell, ChevronDown, ExternalLink, Menu, Search, User } from 'lucide-react';
import { LIME } from '../../theme';
import Sidebar from '../Sidebar';

export default function AdminLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.topbar', { y: -16, opacity: 0, duration: 0.45, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="min-h-screen bg-[#F6F4EE] text-[#171914] antialiased">
      {/* Sidebar (Desktop Docked + Mobile Drawer) */}
      <Sidebar
        active={active}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area: Offset by 288px on lg screens so it never overlaps the sidebar */}
      <div className="min-w-0 flex-1 transition-all duration-300 lg:pl-[288px]">
        {/* Sticky Topbar */}
        <header className="topbar sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/[0.06] bg-[#F6F4EE]/85 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-10">
          {/* Left: Mobile hamburger + Global Search */}
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#171914] shadow-xs transition hover:bg-[#EFECE3] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <label className="flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/90 px-3.5 py-2.5 shadow-xs transition-all focus-within:border-black/30 focus-within:bg-white focus-within:shadow-md">
              <Search className="h-4 w-4 shrink-0 text-[#171914]/40" />
              <input
                type="text"
                placeholder="Search orders, SKU, metrics…"
                className="w-full bg-transparent text-xs font-medium text-[#171914] outline-none placeholder:text-[#171914]/40"
              />
              <kbd className="hidden rounded-md border border-black/[0.08] bg-[#F2EFE8] px-1.5 py-0.5 text-[9px] font-bold text-[#171914]/50 sm:block">
                ⌘K
              </kbd>
            </label>
          </div>

          {/* Right: Storefront, Notifications, User Profile */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3.5">
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#171914] shadow-xs transition hover:border-black/20 hover:bg-[#EFECE3] sm:flex"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Storefront</span>
            </a>

            <button
              type="button"
              aria-label="Notifications (1 unread)"
              className="relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#171914] shadow-xs transition hover:border-black/20 hover:bg-[#EFECE3]"
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white"
                style={{ background: LIME }}
              />
            </button>

            <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white p-1.5 pr-3 shadow-xs transition hover:border-black/20">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-[#191C16] text-white shadow-xs"
                style={{ color: LIME }}
              >
                <User className="h-4 w-4" />
              </span>
              <div className="hidden text-left sm:block">
                <span className="block text-[11px] font-bold leading-tight text-[#171914]">
                  Alex Vance
                </span>
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#171914]/40">
                  Store Admin
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#171914]/40" />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
