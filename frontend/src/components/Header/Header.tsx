import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { LIME } from '../theme'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { useMe } from '../../hooks/useQueries'

const NAV_ITEMS = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'new-arrivals', label: 'New Arrivals' },
] as const

type NavItemId = (typeof NAV_ITEMS)[number]['id']

// Account dropdown stays a light panel so it reads clearly over the dark hero
const menuItemCls =
  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#171914] transition-colors hover:bg-[#EFEBE2]'

const iconBtnCls =
  'flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 sm:h-11 sm:w-11'

const badgeCls =
  'absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-black text-black'

export default function Header() {
  const [activeItem, setActiveItem] = useState<NavItemId>('new-arrivals')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const status = useAuthStore((s) => s.status)
  const me = useMe()
  const logout = useAuthStore((s) => s.logout)
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0))
  const favCount = useCartStore((s) => s.favourites.length)

  // Close menus on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Vertical character replacement animation
  const animateNavText = (element: HTMLAnchorElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const characters = element.querySelectorAll<HTMLElement>('[data-nav-char]')
    const originals: HTMLElement[] = []
    const duplicates: HTMLElement[] = []

    characters.forEach((char) => {
      const original = char.querySelector<HTMLElement>('.char-original')
      const duplicate = char.querySelector<HTMLElement>('.char-duplicate')
      if (original && duplicate) {
        originals.push(original)
        duplicates.push(duplicate)
      }
    })

    gsap.killTweensOf([...originals, ...duplicates])
    gsap.set(originals, { yPercent: 0 })
    gsap.set(duplicates, { yPercent: 100 })

    const timeline = gsap.timeline()
    timeline.to(
      originals,
      { yPercent: -100, duration: 0.7, stagger: 0.055, ease: 'power3.inOut' },
      0
    )
    timeline.to(
      duplicates,
      { yPercent: 0, duration: 0.7, stagger: 0.055, ease: 'power3.inOut' },
      0
    )
  }

  const selectItem = (id: NavItemId) => {
    setActiveItem(id)
    setIsMenuOpen(false)
  }

  const signOut = () => {
    setProfileOpen(false)
    setIsMenuOpen(false)
    logout()
  }

  return (
    <header className="absolute inset-x-0 top-0 z-50 w-full">
      <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-12 xl:px-14">

        {/* LEFT: LOGO + DESKTOP NAVIGATION */}
        <div className="flex min-w-0 items-center gap-5 lg:gap-7 xl:gap-10">

          {/* Logo */}
          <Link
            to="/"
            aria-label="MOVE Gymwear Home"
            className="group flex shrink-0 items-center gap-1.5 transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <svg viewBox="0 0 62 30" className="h-5 w-auto fill-white sm:h-6" aria-hidden="true">
              <path d="M14 0h20L20 30H0z" />
              <path d="M42 0h20L48 30H28z" />
            </svg>
            <span className="font-display text-xl font-black italic leading-none tracking-tighter text-white sm:text-2xl">
              MOVE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-white lg:flex xl:gap-7 xl:text-sm"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => selectItem(item.id)}
                onMouseEnter={(e) => animateNavText(e.currentTarget)}
                aria-label={item.label}
                className="group relative flex min-h-[44px] items-center whitespace-nowrap"
              >
                <span
                  className={`relative py-1 transition-colors duration-200 ${
                    activeItem === item.id
                      ? 'font-bold text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span aria-hidden="true" className="inline-flex">
                    {Array.from(item.label).map((char, index) => (
                      <span
                        key={`${item.id}-${index}`}
                        data-nav-char
                        className="inline-grid overflow-hidden align-bottom"
                      >
                        <span className="char-original block" style={{ gridArea: '1 / 1' }}>
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                        <span className="char-duplicate block" style={{ gridArea: '1 / 1' }}>
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      </span>
                    ))}
                  </span>

                  {/* Lime underline */}
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 ${
                      activeItem === item.id ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                    style={{ backgroundColor: LIME }}
                  />
                </span>
              </a>
            ))}
          </nav>
        </div>

        {/* RIGHT: ACTION ICONS */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">

          {/* Search */}
          <Link to="/search" aria-label="Search" className={iconBtnCls}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="m16 16 5 5" />
            </svg>
          </Link>

          {/* Favourites */}
          <Link
            to="/favourites"
            aria-label={`Favourites (${favCount} items)`}
            className={`relative ${iconBtnCls}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
            </svg>
            {favCount > 0 && (
              <span className={badgeCls} style={{ backgroundColor: LIME }}>
                {favCount}
              </span>
            )}
          </Link>

          {/* Shopping Cart */}
          <Link
            to="/cart"
            aria-label={`Shopping Cart (${cartCount} items)`}
            className={`relative ${iconBtnCls}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l1 13H4z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span className={badgeCls} style={{ backgroundColor: LIME }}>
              {cartCount}
            </span>
          </Link>

          {/* AUTH CLUSTER — same-size placeholder while the session restores,
              so Login/Sign Up never flash and a signed-in user never sees a
              wrong initial or stale role. */}
          {status === 'loading' || (status === 'authenticated' && me.isPending) ? (
            <span aria-hidden="true" className="ml-1 hidden h-10 w-44 sm:block" />
          ) : status === 'authenticated' ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Account menu"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white font-display text-sm font-black italic text-black transition-transform hover:scale-105 sm:h-11 sm:w-11"
              >
                {me.data?.user.name.charAt(0).toUpperCase() ?? '?'}
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-black/10 bg-white shadow-2xl">
                    <div className="border-b border-black/10 px-4 py-3">
                      <p className="truncate text-xs font-bold text-[#111]">{me.data?.user.name}</p>
                      <p className="truncate text-[10px] text-black/50">{me.data?.user.email}</p>
                    </div>

                    <Link to="/profile" onClick={() => setProfileOpen(false)} className={menuItemCls}>
                      Profile
                    </Link>
                    <Link to="/orders" onClick={() => setProfileOpen(false)} className={menuItemCls}>
                      My Orders
                    </Link>

                    {me.data?.user.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className={menuItemCls}>
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-black/10" />
                    <button type="button" onClick={signOut} className={menuItemCls}>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="ml-1 hidden items-center px-3 font-display text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:text-white/60 sm:flex"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden bg-white px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/90 sm:block"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`ml-1 lg:hidden ${iconBtnCls}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isMenuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <nav
        id="mobile-navigation"
        aria-label="Mobile Navigation"
        aria-hidden={!isMenuOpen}
        className={`absolute left-0 right-0 top-full z-40 border-t border-white/10 bg-[#0d0d0d] px-6 py-6 shadow-2xl transition-all duration-300 ease-in-out lg:hidden ${
          isMenuOpen
            ? 'visible translate-y-0 opacity-100'
            : 'invisible pointer-events-none -translate-y-3 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={() => selectItem(item.id)}
              className="font-display flex min-h-[52px] items-center justify-between text-2xl font-bold uppercase tracking-wider text-white transition-colors hover:text-white/60"
            >
              <span
                className={activeItem === item.id ? 'border-b-2 pb-1' : ''}
                style={activeItem === item.id ? { borderColor: LIME } : undefined}
              >
                {item.label}
              </span>
              {activeItem === item.id && (
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LIME }} />
              )}
            </a>
          ))}
        </div>

        {/* Drawer auth links */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
          {status === 'loading' ? (
            <span aria-hidden="true" className="h-9 w-32" />
          ) : status === 'authenticated' ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="font-display text-xs font-bold uppercase tracking-wider text-white"
              >
                Profile
              </Link>
              <Link
                to="/orders"
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="font-display text-xs font-bold uppercase tracking-wider text-white"
              >
                Orders
              </Link>
              {me.data?.user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  tabIndex={isMenuOpen ? 0 : -1}
                  className="font-display text-xs font-bold uppercase tracking-wider text-white"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                tabIndex={isMenuOpen ? 0 : -1}
                className="font-display ml-auto text-xs font-bold uppercase tracking-wider text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="font-display text-xs font-bold uppercase tracking-wider text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
                className="bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-white/60">
          <span>Move Without Limits</span>
          <span style={{ color: LIME }}>● New Arrivals</span>
        </div>
      </nav>
    </header>
  )
}